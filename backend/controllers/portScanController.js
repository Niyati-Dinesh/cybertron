const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const axios = require("axios");

const execAsync = promisify(exec);
const parseStringPromise = xml2js.parseStringPromise;

// SETUP: Load the hardcoded CVE database
const HARDCODED_CVE_DB = JSON.parse(
  fs.readFileSync(path.join(__dirname, "hardcoded-cves.json"), "utf8")
);

// SECURITY: Function to validate the target input : check if its correct IP address or domaain name
const isValidTarget = (target) => {
  if (!target) return false;
  const targetRegex = /^((([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]))|((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))?)$/;
  return targetRegex.test(target);
};
// Helper to check if a text contains a keyword (case-insensitive)

const matchesKeyword = (text = "", keyword) =>
  text && keyword && text.toLowerCase().includes(keyword.toLowerCase());

//nmap provides results in XML FORMAT, this function parses that XML to a js object
const parseNmapXmlToServices = async (xmlString) => {
  try {
    const parsed = await parseStringPromise(xmlString, { explicitArray: true, mergeAttrs: true });
    const services = [];
    const nmaprun = parsed.nmaprun;
    if (!nmaprun || !nmaprun.host) return services;
    for (const host of nmaprun.host) {
      let ip = host.address?.[0]?.addr || "unknown";
      const ports = host.ports?.[0]?.port || [];
      for (const p of ports) {
        services.push({
          ip,
          port: Number(p.portid || p.$?.portid),
          protocol: p.protocol || p.$?.protocol,
          state: p.state?.[0]?.state || "unknown",
          name: p.service?.[0]?.name || p.service?.[0]?.product || "unknown",
          product: p.service?.[0]?.product || "",
          version: p.service?.[0]?.version || "",
          extra: p.service?.[0]?.extrainfo || "",
        });
      }
    }
    return services;
  } catch (error) {
    console.error("❌ Error parsing nmap XML:", error);
    return [];
  }
};

//matches the nmap result with hardcoded CVE db
const correlateWithHardcoded = (service) => {
  const matches = [];
  const serviceText = `${service.name} ${service.product} ${service.version} ${service.extra}`.trim();
  for (const entry of HARDCODED_CVE_DB) {
    for (const kw of entry.productKeywords) {
      if (matchesKeyword(serviceText, kw)) {
        for (const c of entry.cves) {
          matches.push({
            cveId: c.id,
            description: c.description,
            severity: c.severity,
            service,
            source: "HARDCODED",
          });
        }
        break;
      }
    }
  }
  return matches;
};

//If match not founf in hardcoded CVE , query NVD API
// NVD API docs: https://nvd.nist.gov/developers/vulnerabilities
// Note: NVD has rate limits - 5 requests in a rolling 30 second window for free tier
const queryNvdForService = async (service) => {
  try {
    const apiKey = process.env.NVD_API_KEY || "";
    const keyword = encodeURIComponent(`${service.product} ${service.version}`.trim() || service.name);
    if (!keyword) return [];
    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}`;
    const headers = {};
    if (apiKey) headers["apiKey"] = apiKey;
    const resp = await axios.get(url, { headers, timeout: 15000 });
    const cveItems = resp.data?.vulnerabilities || [];
    const results = cveItems.map(item => ({
      cveId: item.cve.id,
      description: item.cve.descriptions?.[0]?.value || "",
      severity: item.cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseSeverity || "UNKNOWN",
      service,
      source: "NVD",
    }));
    return results;
  } catch (err) {
    return [];
  }
};


// Main controller functions

exports.scanAndCorrelate = async (req, res) => {
  const outputFile = path.join(__dirname, "..", "tmp", `nmap_scan_${Date.now()}.xml`);
  try {
    const target = req.query.target || process.env.NMAP_TARGET || "127.0.0.1";
    if (!isValidTarget(target)) {
      return res.status(400).json({ message: "Invalid target provided." });
    }
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    const nmapCmd = `nmap -sV -oX ${outputFile} ${target}`;
    await execAsync(nmapCmd, { timeout: 120000 });
    const xml = fs.readFileSync(outputFile, "utf8");
    const services = await parseNmapXmlToServices(xml);
    const allVulnerabilities = [];
    const nvdQueryPromises = [];
    for (const service of services) {
      const hardMatches = correlateWithHardcoded(service);
      allVulnerabilities.push(...hardMatches);
      nvdQueryPromises.push(queryNvdForService(service));
    }
    const nvdResults = await Promise.all(nvdQueryPromises);
    nvdResults.forEach(matches => allVulnerabilities.push(...matches));
    const uniqueVulnerabilities = allVulnerabilities.filter(
      (vuln, index, self) => index === self.findIndex(v => v.cveId === vuln.cveId && v.service.port === vuln.service.port)
    );
    res.status(200).json({
      scannedTarget: target,
      services,
      vulnerabilities: uniqueVulnerabilities,
      scanTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Scan failed", error: error.message || error.toString() });
  } finally {
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  }
};



// Correlate only endpoint - accepts services in request body and returns correlated vulnerabilities
exports.correlateServices = async (req, res) => {
    try {
        const services = req.body.services || [];
        if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({ message: "Request body must contain a non-empty 'services' array." });
        }
        const allVulnerabilities = [];
        const nvdQueryPromises = [];
        for (const service of services) {
            const hardMatches = correlateWithHardcoded(service);
            allVulnerabilities.push(...hardMatches);
            nvdQueryPromises.push(queryNvdForService(service));
        }
        const nvdResults = await Promise.all(nvdQueryPromises);
        nvdResults.forEach(matches => allVulnerabilities.push(...matches));
        const uniqueVulnerabilities = allVulnerabilities.filter(
            (vuln, index, self) => index === self.findIndex(v => v.cveId === vuln.cveId && v.service.port === vuln.service.port)
        );
        res.status(200).json({
            vulnerabilities: uniqueVulnerabilities,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({ message: "Correlation failed", error: error.message || error.toString() });
    }
};