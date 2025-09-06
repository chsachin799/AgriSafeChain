import React, { useEffect, useRef } from "react";

const CertificateCanvas = ({ recipientName, courseName, issueDate, certificateId }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 1000;
    canvas.height = 700;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Title
    ctx.font = "bold 40px serif";
    ctx.fillStyle = "#0f766e";
    ctx.textAlign = "center";
    ctx.fillText("AgriSafeChain Certificate", canvas.width / 2, 100);

    // Subtitle
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText("This certifies that", canvas.width / 2, 180);

    // Recipient
    ctx.font = "bold 32px serif";
    ctx.fillStyle = "#111827";
    ctx.fillText(recipientName || "__________", canvas.width / 2, 230);

    // Course
    ctx.font = "20px sans-serif";
    ctx.fillText("has successfully completed the", canvas.width / 2, 280);

    ctx.font = "bold 28px serif";
    ctx.fillText(courseName || "__________", canvas.width / 2, 330);

    // Issue Date
    ctx.font = "16px monospace";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(`Issued on: ${issueDate}`, canvas.width / 2, 400);

    // Certificate ID
    ctx.font = "14px monospace";
    ctx.fillText(`Certificate ID: ${certificateId}`, canvas.width / 2, 430);

    // Seal
    ctx.beginPath();
    ctx.arc(canvas.width - 100, canvas.height - 100, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "#2dd4bf";
    ctx.fill();
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("AgriSafe", canvas.width - 100, canvas.height - 95);
    ctx.fillText("Verified", canvas.width - 100, canvas.height - 80);
  }, [recipientName, courseName, issueDate, certificateId]);

  return <canvas ref={canvasRef} className="mx-auto shadow-lg rounded" />;
};

export default CertificateCanvas;
