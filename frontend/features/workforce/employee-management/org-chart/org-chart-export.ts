"use client";

import type { RefObject } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportOrgChartPng(container: HTMLElement, filename = "org-chart.png") {
  const canvas = await html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export async function exportOrgChartPdf(container: HTMLElement, filename = "org-chart.pdf") {
  const canvas = await html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true
  });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save(filename);
}

export function exportOrgChartSvg(containerRef: RefObject<HTMLElement | null>) {
  const svg = containerRef.current?.querySelector(".react-flow__viewport svg");
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGElement;
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.download = "org-chart.svg";
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export function printOrgChart() {
  window.print();
}
