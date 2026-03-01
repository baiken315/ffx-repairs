<template>
  <div class="about-page">
    <div class="about-inner">
      <RouterLink to="/" class="back-link">← Back to Home</RouterLink>

      <h1 class="about-title">About This Tool</h1>
      <p class="about-lead">Important information about this community resource.</p>

      <div class="about-sections">
        <!-- Not affiliated -->
        <section class="about-card">
          <div>
            <h2 class="about-card__title">Not Affiliated with Government</h2>
            <p class="about-card__body">
              This website is an independent community project. It is <strong>not affiliated with, funded by, or endorsed by the Fairfax County Government</strong> or any of its agencies. Any resemblance to official county websites is for familiarity and ease of use only.
            </p>
          </div>
        </section>

        <!-- Community-managed -->
        <section class="about-card">
          <div>
            <h2 class="about-card__title">Community-Managed Content</h2>
            <p class="about-card__body">
              Program information on this site is <strong>researched and maintained by community contributors</strong> drawing from publicly available county sources. We do not guarantee the accuracy, completeness, or timeliness of any information provided. Always verify eligibility details directly with the administering agency before applying.
            </p>
          </div>
        </section>

        <!-- Independent risk -->
        <section class="about-card">
          <div>
            <h2 class="about-card__title">Use at Your Own Discretion</h2>
            <p class="about-card__body">
              Eligibility results produced by this tool are <strong>unvalidated estimates</strong> based on the information you provide and the program data maintained by community contributors. Final eligibility determinations are made solely by the administering agencies. Use of this tool and any contact with listed organizations is done at the independent risk of the user.
            </p>
          </div>
        </section>

        <!-- Mission -->
        <section class="about-card">
          <div>
            <h2 class="about-card__title">Our Mission</h2>
            <p class="about-card__body">
              This tool exists to help Fairfax County residents and caseworkers quickly identify heating, cooling, and home repair assistance programs they may qualify for. Our goal is to reduce the barrier of navigating a complex landscape of programs — making it easier for anyone to find help or connect others with support.
            </p>
          </div>
        </section>

        <!-- Privacy -->
        <section class="about-card">
          <div>
            <h2 class="about-card__title">Your Privacy</h2>
            <p class="about-card__body">
              We do not collect any personal data. This site uses <strong>no cookies</strong>. The only information stored on your device is your language preference (English or Spanish), saved locally in your browser. No answers you provide during the eligibility questionnaire are transmitted to or stored on our servers — the screening happens entirely in your browser.
            </p>
          </div>
        </section>

        <!-- Contact -->
        <section class="about-card about-card--center">
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
