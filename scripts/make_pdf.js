const fs = require('fs');
const path = require('path');

function createResumePDF() {
  const lines = [
    { text: "SAMBIT KUMAR SATAPATHY", font: "F2", size: 16, dy: 22 },
    { text: "SOC Analyst | SIEM and Incident Response", font: "F2", size: 11, dy: 16 },
    { text: "Hyderabad, Telangana, India | Phone: +91 7735207434 | Email: sambitsatapathy22@gmail.com", font: "F1", size: 9, dy: 13 },
    { text: "Portfolio: sambit.page | GitHub: github.com/Sambittt", font: "F1", size: 9, dy: 16 },

    { text: "PROFESSIONAL SUMMARY", font: "F2", size: 10, dy: 15 },
    { text: "Security Operations Center (SOC) Analyst with hands-on experience deploying and operating a Wazuh Security Information", font: "F1", size: 8.5, dy: 11 },
    { text: "and Event Management (SIEM) platform, onboarding endpoints, writing custom detection rules, and investigating security", font: "F1", size: 8.5, dy: 11 },
    { text: "events. Skilled in log analysis, incident response, vulnerability assessment, and network traffic analysis using Nmap and", font: "F1", size: 8.5, dy: 11 },
    { text: "Wireshark. Strong documentation skills including runbooks, incident notes, and technical reporting.", font: "F1", size: 8.5, dy: 15 },

    { text: "SKILLS", font: "F2", size: 10, dy: 15 },
    { text: "SIEM & Monitoring: Wazuh (manager, indexer, dashboard), Splunk, log collection & correlation, alert triage, custom rules", font: "F1", size: 8.5, dy: 11 },
    { text: "Incident Response: Security event investigation, incident response workflow, SOAR (Tines), EDR (LimaCharlie), playbooks", font: "F1", size: 8.5, dy: 11 },
    { text: "Vulnerability Assessment: Nmap scanning, network reconnaissance, vulnerability identification, security exposure reporting", font: "F1", size: 8.5, dy: 11 },
    { text: "Network & Traffic Analysis: Wireshark, TCP/IP, DNS, HTTP, UFW firewall, suspicious traffic detection", font: "F1", size: 8.5, dy: 11 },
    { text: "Operating Systems: Linux (Ubuntu, Kali), Windows 10, Windows 11, Windows Server", font: "F1", size: 8.5, dy: 11 },
    { text: "Scripting & Admin: Bash, cron, user and group management", font: "F1", size: 8.5, dy: 11 },
    { text: "Frameworks: MITRE ATT&CK, Cyber Kill Chain, NIST, SANS incident response lifecycle", font: "F1", size: 8.5, dy: 11 },
    { text: "Cloud & Tools: AWS EC2, Docker, Git, GitHub, VMware, VS Code", font: "F1", size: 8.5, dy: 11 },
    { text: "Reporting: Incident documentation, security procedure documentation, management reports", font: "F1", size: 8.5, dy: 15 },

    { text: "PROFESSIONAL EXPERIENCE", font: "F2", size: 10, dy: 15 },
    { text: "Security Operations Center (SOC) Intern, Wazuh Cloud Project (AWS)", font: "F2", size: 9, dy: 12 },
    { text: "Infozit | Team of 4 | July 2026 - Present", font: "F1", size: 8.5, dy: 11 },
    { text: "- Deployed and configured a pre-production Wazuh SIEM including manager, indexer, and dashboard on AWS EC2.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Onboarded Windows 11, Windows Server, and Ubuntu Server endpoints using Wazuh agents for centralized log collection.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Configured a custom web server to generate and forward HTTP traffic logs to the SIEM.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Authored and tested custom detection rules to identify simulated brute-force and web-based attacks.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Built the initial Wazuh stack using Docker and configured Role-Based Access Control (RBAC) for secure team access.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Managed detection rules and configuration through Git pull-request workflows and maintained operational runbooks.", font: "F1", size: 8.5, dy: 15 },

    { text: "PROJECTS", font: "F2", size: 10, dy: 15 },
    { text: "SOAR and EDR Incident Response Playbook (LimaCharlie, Tines, Slack)", font: "F2", size: 9, dy: 12 },
    { text: "- Enrolled a Windows 10 virtual machine as a LimaCharlie EDR sensor and simulated credential-theft activity using LaZagne.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Created and validated a custom Detection and Response (D&R) rule using historical replay.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Forwarded EDR detections to a Tines webhook and built a SOAR workflow that sends alert details to Slack.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Automated endpoint containment through the LimaCharlie API, with separate YES and NO analyst decision paths.", font: "F1", size: 8.5, dy: 11 },
    { text: "- Tested both response paths and documented the complete incident-response workflow.", font: "F1", size: 8.5, dy: 15 },

    { text: "EDUCATION AND TRAINING", font: "F2", size: 10, dy: 15 },
    { text: "Bachelor of Computer Applications (BCA) | CGPA: 8.2/10", font: "F2", size: 9, dy: 12 },
    { text: "Gayatri Institute of Science and Technology, Berhampur University, Odisha", font: "F1", size: 8.5, dy: 11 },
    { text: "Cybersecurity Program (SOC Focused)", font: "F2", size: 9, dy: 12 },
    { text: "Teks Academy, Hyderabad | July 2026 - Present", font: "F1", size: 8.5, dy: 11 },
    { text: "- SOC operations, networking, ethical hacking, SIEM, EDR, forensics, cloud security, Linux, UFW firewall, and Bash scripting.", font: "F1", size: 8.5, dy: 15 },

    { text: "CERTIFICATIONS & CREDENTIALS", font: "F2", size: 10, dy: 14 },
    { text: "- AttackIQ Academy: Foundations of Operationalizing MITRE ATT&CK v19 (Credly, 13 CPEs)", font: "F1", size: 8.5, dy: 11 },
    { text: "- Deloitte: Cyber Job Simulation (Forage Verified)", font: "F1", size: 8.5, dy: 11 },
    { text: "- Hack & Fix Academy: Certified Online Fraud Prevention Specialist (COFPS)", font: "F1", size: 8.5, dy: 11 },
    { text: "- Cisco: Introduction to Cybersecurity (Credly Verified)", font: "F1", size: 8.5, dy: 11 },
    { text: "- TryHackMe: Pre-Security and Cybersecurity 101 Paths (ID: THM-KKI9XDUMZE)", font: "F1", size: 8.5, dy: 11 }
  ];

  let streamContent = "";
  let y = 750;

  for (const line of lines) {
    y -= line.dy;
    // escape parentheses
    const safeText = line.text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamContent += `BT /${line.font} ${line.size} Tf 50 ${y} Td (${safeText}) Tj ET\n`;
  }

  const objects = [];
  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  // 1: Catalog
  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  // 2: Pages
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  // 3: Page
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`);
  // 4: Font Regular
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  // 5: Font Bold
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  // 6: Stream
  const streamBuf = Buffer.from(streamContent, 'utf-8');
  addObject(`<< /Length ${streamBuf.length} >>\nstream\n${streamContent}endstream`);

  let pdf = "%PDF-1.4\n";
  const xref = [0];

  for (let i = 0; i < objects.length; i++) {
    xref.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(xref[i]).padStart(10, '0') + " 00000 n \n";
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const targetPath = path.join(__dirname, '..', 'assets', 'Sambit_Kumar_Satapathy_Resume.pdf');
  fs.writeFileSync(targetPath, pdf, 'binary');
  console.log("Created resume PDF at:", targetPath);
}

createResumePDF();
