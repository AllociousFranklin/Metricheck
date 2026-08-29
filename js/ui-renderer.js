/**
 * UIRenderer - Handles Canvas overlay drawings, HUD status updates, and capture gallery UI
 */
export class UIRenderer {
  constructor(overlayCanvas, videoElement) {
    this.canvas = overlayCanvas;
    this.ctx = this.canvas.getContext('2d');
    this.video = videoElement;

    // DOM Elements
    this.guidanceBanner = document.getElementById('guidance-banner');
    this.statusPrimary = document.getElementById('status-primary');
    this.statusSecondary = document.getElementById('status-secondary');

    this.valMotion = document.getElementById('val-motion');
    this.valSharpness = document.getElementById('val-sharpness');
    this.valLighting = document.getElementById('val-lighting');

    this.viewCounterText = document.getElementById('view-counter-text');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.thumbnailStrip = document.getElementById('thumbnail-strip');

    this.completeModal = document.getElementById('complete-modal');
    this.capturedGallery = document.getElementById('captured-gallery');
    this.scannerContainer = document.getElementById('scanner-container');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    // setTransform replaces (not stacks) — prevents DPR² scaling on repeated resizes
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  /**
   * Main per-frame render loop
   */
  renderFrame(detection, trackerState, qualityReport, processingWidth = 480, processingHeight = 360) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    // 1. Draw Bounding Box & Annotations if detected
    if (detection && trackerState && trackerState.smoothedBbox) {
      this.drawBoundingBox(trackerState.smoothedBbox, detection.corners, qualityReport, processingWidth, processingHeight);
    }

    // 2. Update Guidance Banner
    if (qualityReport) {
      this.guidanceBanner.className = `guidance-pill ${qualityReport.badgeClass}`;
      this.statusPrimary.textContent = qualityReport.feedbackPrimary;
      this.statusSecondary.textContent = qualityReport.feedbackSecondary;
    }

    // 3. Update Telemetry Card
    if (trackerState && detection) {
      // Motion telemetry
      this.valMotion.textContent = trackerState.state === 'STABLE' ? 'STABLE' : 'MOVING';
      this.valMotion.className = `tel-val ${trackerState.state === 'STABLE' ? 'good' : 'warn'}`;

      // Sharpness telemetry
      const sVal = detection.sharpness || 0;
      this.valSharpness.textContent = sVal;
      this.valSharpness.className = `tel-val ${sVal >= 100 ? 'good' : sVal >= 60 ? 'warn' : 'bad'}`;

      // Lighting telemetry
      const bVal = detection.brightness || 0;
      this.valLighting.textContent = bVal;
      this.valLighting.className = `tel-val ${bVal >= 70 && bVal <= 200 ? 'good' : 'warn'}`;
    }
  }

  /**
   * Draws a futuristic bounding box with corner targets and scanning brackets
   */
  drawBoundingBox(bbox, corners, qualityReport, procW, procH) {
    // Compute scale and aspect ratio mapping between processing canvas and display canvas
    // Accounting for video object-fit: cover
    const videoAspect = (this.video.videoWidth || procW) / (this.video.videoHeight || procH);
    const screenAspect = this.displayWidth / this.displayHeight;

    let scale, offsetX = 0, offsetY = 0;

    if (screenAspect > videoAspect) {
      // Screen is wider than video: video is cropped top/bottom
      scale = this.displayWidth / procW;
      const scaledH = procH * scale;
      offsetY = (this.displayHeight - scaledH) / 2;
    } else {
      // Screen is taller than video: video is cropped left/right
      scale = this.displayHeight / procH;
      const scaledW = procW * scale;
      offsetX = (this.displayWidth - scaledW) / 2;
    }

    const bx = bbox.x * scale + offsetX;
    const by = bbox.y * scale + offsetY;
    const bw = bbox.width * scale;
    const bh = bbox.height * scale;

    // Pick box color based on quality state
    let boxColor = '#3b82f6'; // default blue
    let glowColor = 'rgba(59, 130, 246, 0.5)';

    if (qualityReport) {
      if (qualityReport.isAcceptable) {
        boxColor = '#10b981'; // Green
        glowColor = 'rgba(16, 185, 129, 0.6)';
      } else if (qualityReport.badgeClass === 'state-moving') {
        boxColor = '#f59e0b'; // Amber / Yellow
        glowColor = 'rgba(245, 158, 11, 0.5)';
      } else if (qualityReport.badgeClass === 'state-error') {
        boxColor = '#ef4444'; // Red
        glowColor = 'rgba(239, 68, 68, 0.5)';
      }
    }

    this.ctx.save();

    // Box glow & semi-transparent fill
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 14;
    this.ctx.strokeStyle = boxColor;
    this.ctx.lineWidth = 2.5;

    // Draw main rectangle with slight round corners
    this.drawRoundedRect(this.ctx, bx, by, bw, bh, 8);
    this.ctx.stroke();

    // Draw corner brackets
    const bracketLen = Math.min(24, Math.min(bw, bh) * 0.25);
    this.ctx.lineWidth = 4.5;

    // Top-Left
    this.ctx.beginPath();
    this.ctx.moveTo(bx, by + bracketLen);
    this.ctx.lineTo(bx, by);
    this.ctx.lineTo(bx + bracketLen, by);
    this.ctx.stroke();

    // Top-Right
    this.ctx.beginPath();
    this.ctx.moveTo(bx + bw - bracketLen, by);
    this.ctx.lineTo(bx + bw, by);
    this.ctx.lineTo(bx + bw, by + bracketLen);
    this.ctx.stroke();

    // Bottom-Left
    this.ctx.beginPath();
    this.ctx.moveTo(bx, by + bh - bracketLen);
    this.ctx.lineTo(bx, by + bh);
    this.ctx.lineTo(bx + bracketLen, by + bh);
    this.ctx.stroke();

    // Bottom-Right
    this.ctx.beginPath();
    this.ctx.moveTo(bx + bw - bracketLen, by + bh);
    this.ctx.lineTo(bx + bw, by + bh);
    this.ctx.lineTo(bx + bw, by + bh - bracketLen);
    this.ctx.stroke();

    // Draw corner dots if quadrilateral detected
    if (corners && corners.length === 4) {
      this.ctx.shadowBlur = 4;
      this.ctx.fillStyle = '#ffffff';
      for (const pt of corners) {
        const px = pt.x * scale + offsetX;
        const py = pt.y * scale + offsetY;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Triggers visual camera flash animation and haptic vibration upon photo capture
   */
  triggerCaptureFlash() {
    // Haptic feedback on mobile (brief vibration pulse)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const flashDiv = document.createElement('div');
    flashDiv.style.position = 'absolute';
    flashDiv.style.top = '0';
    flashDiv.style.left = '0';
    flashDiv.style.width = '100%';
    flashDiv.style.height = '100%';
    flashDiv.className = 'flash-effect';
    this.scannerContainer.appendChild(flashDiv);

    setTimeout(() => {
      if (flashDiv.parentNode) {
        flashDiv.parentNode.removeChild(flashDiv);
      }
    }, 400);
  }

  /**
   * Updates captured view counter & progress bar
   */
  updateProgress(currentCount, targetCount) {
    this.viewCounterText.textContent = `${currentCount} / ${targetCount}`;
    const pct = Math.min(100, Math.round((currentCount / targetCount) * 100));
    this.progressBarFill.style.width = `${pct}%`;
  }

  /**
   * Inserts or updates captured thumbnail slot
   */
  setThumbnail(viewIndex, canvasBlobUrl) {
    const slot = this.thumbnailStrip.querySelector(`.thumbnail-slot[data-index="${viewIndex}"]`);
    if (slot) {
      slot.classList.add('captured');
      slot.innerHTML = `
        <img src="${canvasBlobUrl}" alt="View ${viewIndex}" />
        <span class="slot-number" style="position:absolute; bottom:4px; right:6px; font-size:11px; z-index:2; text-shadow:0 1px 4px #000; color:#fff;">✓ ${viewIndex}</span>
      `;
    }
  }

  /**
   * Highlights the upcoming thumbnail slot as pending
   */
  highlightPendingSlot(viewIndex) {
    const allSlots = this.thumbnailStrip.querySelectorAll('.thumbnail-slot');
    allSlots.forEach(s => s.classList.remove('active-pending'));

    const nextSlot = this.thumbnailStrip.querySelector(`.thumbnail-slot[data-index="${viewIndex}"]`);
    if (nextSlot && !nextSlot.classList.contains('captured')) {
      nextSlot.classList.add('active-pending');
    }
  }

  /**
   * Displays the Scan Complete modal with high-res thumbnails and actions
   */
  showScanComplete(capturedViews, onDownload, onRestart, onRunCompliance) {
    this.capturedGallery.innerHTML = '';

    capturedViews.forEach((view, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <img src="${view.thumbnailUrl}" alt="Captured View ${idx + 1}" />
        <span class="gallery-badge">View #${idx + 1}</span>
      `;
      this.capturedGallery.appendChild(item);
    });

    this.completeModal.style.display = 'flex';

    const btnDownload = document.getElementById('btn-download-all');
    const btnRestart = document.getElementById('btn-restart-scan');
    const btnCompliance = document.getElementById('btn-run-compliance');

    if (btnDownload) {
      btnDownload.onclick = () => {
        if (onDownload) onDownload();
      };
    }

    if (btnRestart) {
      btnRestart.onclick = () => {
        this.completeModal.style.display = 'none';
        if (onRestart) onRestart();
      };
    }

    if (btnCompliance) {
      btnCompliance.onclick = () => {
        if (onRunCompliance) onRunCompliance();
      };
    }
  }

  /**
   * Renders the interactive Compliance Report modal (Constraint #2)
   */
  showComplianceReport(report, onDownloadJson, onBack) {
    const complianceModal = document.getElementById('compliance-modal');
    const gradeBadge = document.getElementById('report-grade-badge');
    const statPassed = document.getElementById('stat-passed');
    const statWarnings = document.getElementById('stat-warnings');
    const statFailed = document.getElementById('stat-failed');
    const checklistContainer = document.getElementById('compliance-checklist');
    const jsonPre = document.getElementById('extracted-fields-json');
    const btnClose = document.getElementById('btn-close-compliance');
    const btnBack = document.getElementById('btn-back-to-gallery');
    const btnDownload = document.getElementById('btn-download-report');

    if (!complianceModal) return;

    // Update Summary Statistics
    const s = report.summary || {};
    statPassed.textContent = s.passed ?? 0;
    statWarnings.textContent = s.warnings ?? 0;
    statFailed.textContent = s.failed ?? 0;

    gradeBadge.textContent = s.compliance_grade || (s.overall_compliant ? 'COMPLIANT' : 'NON-COMPLIANT');
    gradeBadge.className = `modal-badge ${s.overall_compliant ? 'success-badge' : ''}`;

    // Render Checklist Rows
    checklistContainer.innerHTML = '';
    const checks = report.compliance || [];

    checks.forEach(c => {
      const row = document.createElement('div');
      row.className = 'compliance-row';

      const chipClass = c.status === 'PASS' ? 'chip-pass' : c.status === 'WARNING' ? 'chip-warn' : 'chip-fail';
      const statusIcon = c.status === 'PASS' ? '✓' : c.status === 'WARNING' ? '⚠' : '✕';

      row.innerHTML = `
        <div class="compliance-row-header">
          <div class="compliance-title-group">
            <span class="compliance-title">${c.label}</span>
            <span class="rule-chip">${c.rule_ref}</span>
          </div>
          <span class="status-chip ${chipClass}">${statusIcon} ${c.status}</span>
        </div>
        <div class="compliance-msg">${c.message}</div>
      `;
      checklistContainer.appendChild(row);
    });

    // Render Extracted Fields JSON
    if (jsonPre) {
      jsonPre.textContent = JSON.stringify(report.extracted_fields || {}, null, 2);
    }

    // Show modal
    complianceModal.style.display = 'flex';

    // Hook buttons
    const closeHandler = () => {
      complianceModal.style.display = 'none';
      if (onBack) onBack();
    };

    if (btnClose) btnClose.onclick = closeHandler;
    if (btnBack) btnBack.onclick = closeHandler;

    if (btnDownload) {
      btnDownload.onclick = () => {
        if (onDownloadJson) onDownloadJson(report);
      };
    }
  }

  /**
   * Resets the UI and dynamically generates thumbnail slots based on targetCount.
   * This ensures changing CONFIG.TARGET_VIEWS always produces the correct number of slots.
   */
  resetUI(targetCount = 4) {
    this.updateProgress(0, targetCount);
    this.completeModal.style.display = 'none';

    // Dynamically build thumbnail slots from target count
    const defaultLabels = ['Front', 'Side A', 'Back', 'Side B', 'Top', 'Bottom'];
    this.thumbnailStrip.innerHTML = '';
    for (let i = 0; i < targetCount; i++) {
      const slot = document.createElement('div');
      slot.className = 'thumbnail-slot';
      slot.setAttribute('data-index', String(i + 1));
      slot.innerHTML = `
        <span class="slot-number">${i + 1}</span>
        <span class="slot-label">${defaultLabels[i] || `View ${i + 1}`}</span>
      `;
      this.thumbnailStrip.appendChild(slot);
    }
    this.highlightPendingSlot(1);
  }
}

