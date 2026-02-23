<template>
  <div class="about-page">
    <div class="about-inner">
      <RouterLink to="/" class="back-link">← Back to Home</RouterLink>

      <h1 class="about-title">About This Tool</h1>
      <p class="about-lead">Important information about this community resource.</p>

      <div class="about-sections">
        <!-- Not affiliated -->
        <section class="about-card">
          <div class="about-icon about-icon--blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <h2 class="about-card__title">Not Affiliated with Government</h2>
            <p class="about-card__body">
              This website is an independent community project. It is <strong>not affiliated with, funded by, or endorsed by the Fairfax County Government</strong> or any of its agencies. Any resemblance to official county websites is for familiarity and ease of use only.
            </p>
          </div>
        </section>

        <!-- Community-managed -->
        <section class="about-card">
          <div class="about-icon about-icon--purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <h2 class="about-card__title">Community-Managed Content</h2>
            <p class="about-card__body">
              Program information on this site is <strong>researched and maintained by community contributors</strong> drawing from publicly available county sources. We do not guarantee the accuracy, completeness, or timeliness of any information provided. Always verify eligibility details directly with the administering agency before applying.
            </p>
          </div>
        </section>

        <!-- Independent risk -->
        <section class="about-card">
          <div class="about-icon about-icon--amber">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h2 class="about-card__title">Use at Your Own Discretion</h2>
            <p class="about-card__body">
              Eligibility results produced by this tool are <strong>unvalidated estimates</strong> based on the information you provide and the program data maintained by community contributors. Final eligibility determinations are made solely by the administering agencies. Use of this tool and any contact with listed organizations is done at the independent risk of the user.
            </p>
          </div>
        </section>

        <!-- Mission -->
        <section class="about-card">
          <div class="about-icon about-icon--green">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h2 class="about-card__title">Our Mission</h2>
            <p class="about-card__body">
              This tool exists to help Fairfax County residents and caseworkers quickly identify heating, cooling, and home repair assistance programs they may qualify for. Our goal is to reduce the barrier of navigating a complex landscape of programs — making it easier for anyone to find help or connect others with support.
            </p>
          </div>
        </section>

        <!-- Privacy -->
        <section class="about-card">
          <div class="about-icon about-icon--green">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <h2 class="about-card__title">Your Privacy</h2>
            <p class="about-card__body">
              We do not collect any personal data. This site uses <strong>no cookies</strong>. The only information stored on your device is your language preference (English or Spanish), saved locally in your browser. No answers you provide during the eligibility questionnaire are transmitted to or stored on our servers — the screening happens entirely in your browser.
            </p>
          </div>
        </section>

        <!-- Contact -->
        <section class="about-card about-card--center">
          <div class="about-icon about-icon--gray">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <h2 class="about-card__title">Contact</h2>
            <p class="about-card__body">For suggestions, corrections, questions about program data, or to get involved with this project:</p>
            <a href="mailto:ffx_services@proton.me" class="about-email">ffx_services@proton.me</a>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.about-page {
  background: var(--color-bg-muted);
  min-height: calc(100dvh - 60px);
  padding: var(--sp-8) var(--sp-4);
}
.about-inner {
  max-width: 760px;
  margin: 0 auto;
}
.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  margin-bottom: var(--sp-5);
  transition: color 0.15s;
}
.back-link:hover { color: var(--color-primary); }

.about-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--sp-1);
}
.about-lead {
  color: var(--color-text-muted);
  font-size: var(--text-base);
  margin-bottom: var(--sp-6);
}

.about-sections {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.about-card {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  display: flex;
  gap: var(--sp-5);
  align-items: flex-start;
  box-shadow: var(--shadow-sm);
}
.about-card > div { min-width: 0; flex: 1; }
.about-card--center { align-items: flex-start; }

.about-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.about-icon--blue   { background: #eff6ff; color: #2563eb; }
.about-icon--purple { background: #f5f3ff; color: #7c3aed; }
.about-icon--amber  { background: #fffbeb; color: #d97706; }
.about-icon--green  { background: #f0fdf4; color: #16a34a; }
.about-icon--gray   { background: var(--color-bg-muted); color: var(--color-text-muted); }

.about-card__title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--sp-2);
}
.about-card__body {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.7;
}
.about-email {
  display: inline-block;
  margin-top: var(--sp-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
.about-email:hover { text-decoration: underline; }
</style>
