/* Crew Academy 301 · Advanced: small helpers shared by several pages.
   Load AFTER assets/js/site.js (needs window.CA). */
(function () {
  "use strict";
  if (!window.CA) return;
  const CA = window.CA;
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* Learner outputs per module. Keys match the data-field names on each module's evidence card.
     evidence.html and the Module 8 builder read these. */
  const EVIDENCE = {
    m1: { title: "Trace portfolio work and business outcomes", output: "A justified portfolio stage and a short list of outcome evidence, risk treatment and ownership still needed.", fields: [
      ["stage", "Portfolio stage for CRW-5 and why"],
      ["evidence", "Outcome evidence still needed before Done"],
      ["risk", "Risk treatment, owner and any escalation"],
      ["sizing", "How portfolio sizing and team estimates support their decisions"]] },
    m2: { title: "Compare Plans scenarios across teams", output: "Two scenario views and a recommendation tied to capacity, dependency order and the release target.", fields: [
      ["optionA", "Option A: sprint load, dependency order, release date"],
      ["optionB", "Option B: sprint load, dependency order, release date"],
      ["recommend", "Recommended option and its assumptions"],
      ["review", "Review changes: what was listed and what you did"]] },
    m3: { title: "Reconcile eazyBI and Jira delivery metrics", output: "A reconciled report note with the two totals, reason, source key and the verified reporting definition.", fields: [
      ["totals", "The two totals and the aligned scope (team, sprint, filter, import time)"],
      ["reason", "Reason for the difference"],
      ["keys", "Source keys with status at sprint close and today"],
      ["definition", "Verified reporting definition saved with the report copy"],
      ["action", "Correction or next owner action"]] },
    m4: { title: "Evaluate release quality in Zephyr", output: "A coverage finding, a targeted retest choice and a release-quality recommendation.", fields: [
      ["coverage", "Coverage finding (missing acceptance criterion)"],
      ["execution", "Unresolved or unexecuted test execution"],
      ["retest", "Targeted retest choice and the linked Bug"],
      ["decision", "Proceed, hold or clarify, with the precise missing evidence"]] },
    m5: { title: "Connect Jira to Git and verify traceability", output: "A Jira item with matching development activity or a documented diagnosis using the captured example.", fields: [
      ["item", "Jira item and the development activity traced to it"],
      ["diagnosis", "Missing or wrong key found"],
      ["fix", "Permitted correction and the verified result"],
      ["check", "Access or sync check if activity still doesn't appear"]] },
    m6: { title: "Connect Claude through Atlassian MCP", output: "A verified item retrieval, source link and an explained permission boundary.", fields: [
      ["retrieval", "Item retrieved: key, status and checked facts"],
      ["source", "Source link and training site verified"],
      ["tool", "Tool that supported the read and the permission behind it"],
      ["boundary", "Permission boundary and where to route a missing-access request"]] },
    m7: { title: "Validate Claude queries and protect metric quality", output: "The original and corrected query, expected and actual keys, metric definition and one identified risk.", fields: [
      ["original", "Original generated query and its actual keys"],
      ["corrected", "Corrected query, count and actual keys"],
      ["expected", "Expected keys and the decoy check"],
      ["definition", "Metric definition (denominator) and the velocity check"],
      ["risk", "One identified risk"]] },
    m8: { title: "Make a release decision across tools", output: "A complete release decision worksheet and a short explanation that peers can verify from the source records.", fields: [
      ["decision", "Recommendation: proceed, hold or clarify"],
      ["forecast", "Delivery forecast (chosen Plan scenario)"],
      ["measure", "Reconciled measure"],
      ["quality", "Quality evidence"],
      ["trace", "Development traceability"],
      ["mcp", "Verified MCP query or retrieval"],
      ["assumptions", "Assumptions and unverified claims"],
      ["next", "Next action, accountable role and evidence to revisit"],
      ["script", "Three-minute explanation"],
      ["peer", "Peer check: what your partner verified"]] }
  };

  const seatNum = () => { const s = CA.seat(); return s ? Number(s) : 0; };
  /* Seat item key: CRP-(21 + (NN-1)*16 + offset). Offsets come from the instructor seat table. */
  const seatKey = (offset, s) => { const n = s ? Number(s) : seatNum(); return n ? "CRP-" + (21 + (n - 1) * 16 + Number(offset || 0)) : "CRP-?"; };
  const seatEpic = s => { const n = s ? Number(s) : seatNum(); return n ? "CRP-" + n : "CRP-(your seat number)"; };

  /* Write one evidence field from a widget (keeps the visible card and saved copy in sync). */
  function saveEvidence(mod, field, value, append) {
    const el = document.querySelector('.evidence[data-evidence="' + mod + '"] [data-field="' + field + '"]');
    const s = CA.store.get("ev:" + mod, {});
    const next = append && s[field] ? s[field].replace(/\s+$/, "") + "\n" + value : value;
    s[field] = next; s._at = new Date().toISOString(); CA.store.set("ev:" + mod, s);
    if (el) { el.value = next; const card = el.closest(".evidence"); const n = card && card.querySelector(".saved"); if (n) n.textContent = "Saved in this browser ✓"; }
    return next;
  }

  function copy(text, btn) {
    const done = () => { if (btn) { const t = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(() => btn.textContent = t, 1400); } else CA.toast("Copied ✓"); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => CA.toast("Select the text and copy it manually"));
    else CA.toast("Select the text and copy it manually");
  }

  function applySeatKeys(root) {
    $$("[data-seat-key]", root).forEach(el => { el.textContent = seatKey(el.dataset.seatKey); });
    $$("[data-seat-epic]", root).forEach(el => { el.textContent = seatEpic(); });
    $$("a[data-jira-seat-key]", root).forEach(a => { const k = seatKey(a.dataset.jiraSeatKey); if (k.indexOf("?") < 0) { a.href = CA.siteUrl() + "/browse/" + k; a.target = "_blank"; a.rel = "noopener"; } });
    $$("a[data-jira-seat-epic]", root).forEach(a => { if (seatNum()) { a.href = CA.siteUrl() + "/browse/" + seatEpic(); a.target = "_blank"; a.rel = "noopener"; } });
  }
  applySeatKeys(document);

  window.CW = { EVIDENCE, seatNum, seatKey, seatEpic, saveEvidence, copy, applySeatKeys };
})();
