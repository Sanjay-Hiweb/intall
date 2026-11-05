    /* ==========================================================================
       NAVIGATION CONTROLLER
       ========================================================================== */
    function goToScreen(screenNumber) {
      if (screenNumber === 2 && !isPlotValid()) return;
      if (screenNumber === 3 && state.candidates.length === 0) findCandidates();
      if (screenNumber === 4 && !state.selectedCandidate) return;

      state.screen = screenNumber;

      // Update screen visibility
      document.querySelectorAll(".screen").forEach(el => el.classList.remove("active"));
      const targetScreen = document.getElementById(`screen${screenNumber}`);
      if (targetScreen) targetScreen.classList.add("active");

      // Update stepper nav
      for (let i = 1; i <= 4; i++) {
        const navEl = document.getElementById(`navStep${i}`);
        if (!navEl) continue;
        navEl.classList.remove("active", "completed");
        if (i === screenNumber) navEl.classList.add("active");
        else if (i < screenNumber) navEl.classList.add("completed");
      }

      // Screen specific hooks
      if (screenNumber === 1) {
        setTimeout(renderPlotPreview, 50);
      } else if (screenNumber === 3) {
        setTimeout(renderCandidateCards, 50);
      } else if (screenNumber === 4) {
        setTimeout(() => {
          renderResultScreen();
        }, 50);
      }
    }
