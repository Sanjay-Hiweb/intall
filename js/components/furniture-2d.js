    /* ==========================================================================
       INTALL SIGNATURE 2D VECTOR FURNITURE ENGINE (HTML5 CANVAS)
       ========================================================================== */
    function drawVectorFurniture(ctx, room, scale, rx, ry, rw, rh) {
      ctx.save();

      if (room.type === "hall") {
        // Living Room: L-shaped Sectional Sofa + Designer Coffee Table + Media Credenza + Rug
        const rugW = Math.max(20, rw * 0.72);
        const rugH = Math.max(20, rh * 0.65);
        const rugX = rx + (rw - rugW) / 2;
        const rugY = ry + (rh - rugH) / 2;

        ctx.fillStyle = "rgba(225, 220, 210, 0.45)";
        ctx.strokeStyle = "rgba(180, 170, 160, 0.6)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(rugX, rugY, rugW, rugH);
        ctx.fillRect(rugX, rugY, rugW, rugH);
        ctx.setLineDash([]);

        const sofaDepth = Math.min(rw * 0.22, 3.2 * scale);
        const sofaW = rugW * 0.85;
        const sofaH = rugH * 0.75;
        ctx.fillStyle = "#E4E0D7";
        ctx.strokeStyle = "#5A524C";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.rect(rugX + 4, rugY + 4, sofaW, sofaDepth);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(rugX + 4, rugY + 4 + sofaDepth, sofaDepth, sofaH - sofaDepth);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(90, 82, 76, 0.45)";
        ctx.lineWidth = 1;
        const numCushions = 3;
        const cWidth = (sofaW - sofaDepth) / numCushions;
        for (let i = 1; i < numCushions; i++) {
          ctx.beginPath();
          ctx.moveTo(rugX + 4 + sofaDepth + i * cWidth, rugY + 4);
          ctx.lineTo(rugX + 4 + sofaDepth + i * cWidth, rugY + 4 + sofaDepth);
          ctx.stroke();
        }

        const ctW = sofaW * 0.45;
        const ctH = sofaDepth * 0.85;
        const ctX = rugX + sofaDepth + 10;
        const ctY = rugY + sofaDepth + 8;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#5A524C";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ctX, ctY, ctW, ctH);
        ctx.fillRect(ctX, ctY, ctW, ctH);

        const credW = rw * 0.55;
        const credD = Math.min(rh * 0.12, 1.8 * scale);
        ctx.fillStyle = "#3E3834";
        ctx.fillRect(rx + (rw - credW) / 2, ry + rh - credD - 3, credW, credD);
        ctx.fillStyle = "#A8A29E";
        ctx.font = `600 ${Math.max(7, 9 * scale / 15)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("MEDIA / TV", rx + rw / 2, ry + rh - credD / 2 - 3);

      } else if (room.type === "bedroom") {
        const bedW = Math.min(rw * 0.52, 6.5 * scale);
        const bedL = Math.min(rh * 0.60, 6.8 * scale);
        const bedX = rx + (rw - bedW) / 2;
        const bedY = ry + 6;

        ctx.fillStyle = "#3A342F";
        ctx.fillRect(bedX - 2, bedY, bedW + 4, 3 * scale / 12);

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#5A524C";
        ctx.lineWidth = 1.5;
        ctx.fillRect(bedX, bedY + 3, bedW, bedL);
        ctx.strokeRect(bedX, bedY + 3, bedW, bedL);

        const pilW = (bedW - 6) / 2;
        const pilH = Math.min(bedL * 0.28, 1.8 * scale);
        ctx.fillStyle = "#EAE6DE";
        ctx.strokeStyle = "#78716C";
        ctx.lineWidth = 1;
        ctx.fillRect(bedX + 2, bedY + 6, pilW, pilH);
        ctx.strokeRect(bedX + 2, bedY + 6, pilW, pilH);
        ctx.fillRect(bedX + 4 + pilW, bedY + 6, pilW, pilH);
        ctx.strokeRect(bedX + 4 + pilW, bedY + 6, pilW, pilH);

        ctx.fillStyle = "rgba(194, 139, 56, 0.22)";
        ctx.fillRect(bedX, bedY + bedL * 0.55, bedW, bedL * 0.45);
        ctx.strokeStyle = "rgba(194, 139, 56, 0.6)";
        ctx.beginPath();
        ctx.moveTo(bedX, bedY + bedL * 0.55);
        ctx.lineTo(bedX + bedW, bedY + bedL * 0.55);
        ctx.stroke();

        const nsSize = Math.min(2.0 * scale, (rw - bedW) / 3);
        if (nsSize > 6) {
          ctx.fillStyle = "#F5F2EA";
          ctx.strokeStyle = "#78716C";
          ctx.lineWidth = 1.2;
          ctx.fillRect(bedX - nsSize - 3, bedY + 4, nsSize, nsSize);
          ctx.strokeRect(bedX - nsSize - 3, bedY + 4, nsSize, nsSize);
          ctx.fillRect(bedX + bedW + 3, bedY + 4, nsSize, nsSize);
          ctx.strokeRect(bedX + bedW + 3, bedY + 4, nsSize, nsSize);
          ctx.fillStyle = "#D97706";
          ctx.beginPath();
          ctx.arc(bedX - nsSize / 2 - 3, bedY + 4 + nsSize / 2, nsSize * 0.25, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bedX + bedW + 3 + nsSize / 2, bedY + 4 + nsSize / 2, nsSize * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        const wardD = Math.min(rh * 0.18, 2.2 * scale);
        ctx.fillStyle = "#F0EDE4";
        ctx.strokeStyle = "#78716C";
        ctx.lineWidth = 1.2;
        ctx.fillRect(rx + 4, ry + rh - wardD - 3, rw - 8, wardD);
        ctx.strokeRect(rx + 4, ry + rh - wardD - 3, rw - 8, wardD);
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(rx + rw / 2, ry + rh - wardD - 3);
        ctx.lineTo(rx + rw / 2, ry + rh - 3);
        ctx.stroke();
        ctx.setLineDash([]);

      } else if (room.type === "dining") {
        const tblW = Math.min(rw * 0.65, 6.0 * scale);
        const tblH = Math.min(rh * 0.50, 3.5 * scale);
        const tblX = rx + (rw - tblW) / 2;
        const tblY = ry + (rh - tblH) / 2;

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#5A524C";
        ctx.lineWidth = 1.5;
        ctx.fillRect(tblX, tblY, tblW, tblH);
        ctx.strokeRect(tblX, tblY, tblW, tblH);

        ctx.fillStyle = "rgba(31, 138, 112, 0.15)";
        ctx.fillRect(tblX + 4, tblY + tblH * 0.25, tblW - 8, tblH * 0.5);

        const chrW = tblW / 4.2;
        const chrD = Math.min(1.4 * scale, 12);
        ctx.fillStyle = "#E4E0D7";
        ctx.strokeStyle = "#78716C";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const cx = tblX + (i + 0.6) * (tblW / 3.4);
          ctx.fillRect(cx, tblY - chrD - 1, chrW, chrD);
          ctx.strokeRect(cx, tblY - chrD - 1, chrW, chrD);
          ctx.fillRect(cx, tblY + tblH + 1, chrW, chrD);
          ctx.strokeRect(cx, tblY + tblH + 1, chrW, chrD);
        }

      } else if (room.type === "kitchen") {
        const cntD = Math.min(rw * 0.28, 2.2 * scale);
        ctx.fillStyle = "#EAE8E3";
        ctx.strokeStyle = "#78716C";
        ctx.lineWidth = 1.5;

        ctx.fillRect(rx + 3, ry + 3, rw - 6, cntD);
        ctx.strokeRect(rx + 3, ry + 3, rw - 6, cntD);

        ctx.fillRect(rx + rw - cntD - 3, ry + 3, cntD, rh - 6);
        ctx.strokeRect(rx + rw - cntD - 3, ry + 3, cntD, rh - 6);

        const ckX = rx + 8;
        const ckY = ry + 5;
        const ckW = cntD * 1.5;
        const ckH = cntD * 0.8;
        ctx.fillStyle = "#332F2C";
        ctx.fillRect(ckX, ckY, ckW, ckH);
        ctx.fillStyle = "#F59E0B";
        const rRad = Math.min(ckH * 0.2, 4);
        [
          [ckX + ckW * 0.3, ckY + ckH * 0.3],
          [ckX + ckW * 0.7, ckY + ckH * 0.3],
          [ckX + ckW * 0.3, ckY + ckH * 0.7],
          [ckX + ckW * 0.7, ckY + ckH * 0.7]
        ].forEach(([bx, by]) => {
          ctx.beginPath(); ctx.arc(bx, by, rRad, 0, Math.PI * 2); ctx.fill();
        });

        const skX = rx + rw - cntD - 1;
        const skY = ry + rh * 0.35;
        const skW = cntD * 0.85;
        const skH = Math.min(rh * 0.32, 3.2 * scale);
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.fillRect(skX, skY, skW, skH);
        ctx.strokeRect(skX, skY, skW, skH);
        ctx.beginPath();
        ctx.moveTo(skX, skY + skH / 2);
        ctx.lineTo(skX + skW, skY + skH / 2);
        ctx.stroke();

        const refSize = cntD * 1.15;
        ctx.fillStyle = "#CBD5E1";
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 1.5;
        ctx.fillRect(rx + 4, ry + rh - refSize - 4, refSize, refSize);
        ctx.strokeRect(rx + 4, ry + rh - refSize - 4, refSize, refSize);
        ctx.fillStyle = "#1E293B";
        ctx.font = `700 ${Math.max(7, 8 * scale / 15)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("REF", rx + 4 + refSize / 2, ry + rh - refSize / 2 - 4);

      } else if (room.type === "bathroom") {
        const shwW = Math.min(rw * 0.45, 3.5 * scale);
        const shwH = Math.min(rh * 0.55, 3.5 * scale);

        ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 1.5;
        ctx.fillRect(rx + 3, ry + 3, shwW, shwH);
        ctx.strokeRect(rx + 3, ry + 3, shwW, shwH);
        ctx.fillStyle = "#94A3B8";
        ctx.beginPath();
        ctx.arc(rx + 3 + shwW / 2, ry + 3 + shwH / 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        const wcW = Math.min(rw * 0.32, 1.8 * scale);
        const wcH = Math.min(rh * 0.42, 2.4 * scale);
        const wcX = rx + rw - wcW - 5;
        const wcY = ry + 4;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#64748B";
        ctx.lineWidth = 1.2;
        ctx.fillRect(wcX, wcY, wcW, wcH * 0.35);
        ctx.strokeRect(wcX, wcY, wcW, wcH * 0.35);
        ctx.beginPath();
        ctx.ellipse(wcX + wcW / 2, wcY + wcH * 0.7, wcW * 0.42, wcH * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const vanW = Math.min(rw * 0.45, 3.0 * scale);
        const vanH = Math.min(rh * 0.28, 1.6 * scale);
        const vanX = rx + 4;
        const vanY = ry + rh - vanH - 4;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#64748B";
        ctx.lineWidth = 1.2;
        ctx.fillRect(vanX, vanY, vanW, vanH);
        ctx.strokeRect(vanX, vanY, vanW, vanH);
        ctx.beginPath();
        ctx.arc(vanX + vanW / 2, vanY + vanH / 2, vanH * 0.35, 0, Math.PI * 2);
        ctx.stroke();

      } else if (room.type === "parking") {
        const carW = Math.min(rw * 0.68, 6.2 * scale);
        const carL = Math.min(rh * 0.78, 14.0 * scale);
        const cx = rx + (rw - carW) / 2;
        const cy = ry + (rh - carL) / 2;

        ctx.fillStyle = "rgba(40, 45, 55, 0.08)";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(cx, cy, carW, carL, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
        ctx.beginPath();
        ctx.roundRect(cx + carW * 0.12, cy + carL * 0.20, carW * 0.76, carL * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(cx + carW * 0.14, cy + carL * 0.68, carW * 0.72, carL * 0.18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#475569";
        ctx.fillRect(cx - 3, cy + carL * 0.26, 3, 5);
        ctx.fillRect(cx + carW, cy + carL * 0.26, 3, 5);

        ctx.fillStyle = "#F59E0B";
        ctx.fillRect(cx + 4, cy, 6, 2.5);
        ctx.fillRect(cx + carW - 10, cy, 6, 2.5);

      } else if (room.type === "study") {
        const dskW = Math.min(rw * 0.70, 5.5 * scale);
        const dskD = Math.min(rh * 0.35, 2.4 * scale);
        const dx = rx + (rw - dskW) / 2;
        const dy = ry + 6;

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#5A524C";
        ctx.lineWidth = 1.5;
        ctx.fillRect(dx, dy, dskW, dskD);
        ctx.strokeRect(dx, dy, dskW, dskD);

        const lpW = dskW * 0.3;
        const lpH = dskD * 0.45;
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(dx + (dskW - lpW) / 2, dy + (dskD - lpH) / 2, lpW, lpH);

        ctx.fillStyle = "#4B5563";
        ctx.beginPath();
        ctx.arc(dx + dskW / 2, dy + dskD + 8, 6, 0, Math.PI * 2);
        ctx.fill();

      } else if (room.type === "pooja") {
        const altW = rw * 0.6;
        const altH = rh * 0.45;
        ctx.fillStyle = "#FEF3C7";
        ctx.strokeStyle = "#D97706";
        ctx.lineWidth = 1.5;
        ctx.fillRect(rx + (rw - altW) / 2, ry + (rh - altH) / 2, altW, altH);
        ctx.strokeRect(rx + (rw - altW) / 2, ry + (rh - altH) / 2, altW, altH);

        ctx.fillStyle = "#DC2626";
        ctx.font = `700 ${Math.max(10, 12 * scale / 15)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🕉", rx + rw / 2, ry + rh / 2);
      }

      ctx.restore();
    }
