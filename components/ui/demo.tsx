"use client"

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer"

export default function Demo() {
  // w-full matters: 21st centres demos in a flex wrapper, and a flex item
  // left at width:auto shrinks the canvas to 0px wide.
  return (
    <div className="w-full">
      <HalftoneWordmarkFooter
        wordmark="sambit"
        label="Sambit K. Satapathy"
        meta="SOC Analyst · SIEM & Incident Response"
        columns={[
          {
            title: "Focus",
            links: [
              { label: "Wazuh SIEM", href: "#" },
              { label: "EDR & SOAR", href: "#" },
              { label: "Incident Response", href: "#" },
            ],
          },
          {
            title: "Navigation",
            links: [
              { label: "About", href: "/about.html" },
              { label: "Experience", href: "/experience.html" },
              { label: "Skills", href: "/skills.html" },
              { label: "Certs", href: "/certifications.html" },
            ],
          },
          {
            title: "Connect",
            links: [
              { label: "GitHub", href: "https://github.com/Sambittt" },
              { label: "LinkedIn", href: "https://linkedin.com/in/sambit-satapathy" },
              { label: "Contact", href: "/contact.html" },
            ],
          },
        ]}
      />
    </div>
  )
}
