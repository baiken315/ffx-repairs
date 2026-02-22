<template>
  <div class="home">
    <div class="home__hero">
      <div class="container">
        <h1 class="home__title">{{ $t('ui.app_name') }}</h1>
        <p class="home__subtitle">{{ $t('ui.app_tagline') }}</p>
        <RouterLink to="/questionnaire" class="btn btn--accent home__cta">
          {{ $t('ui.start_button') }} →
        </RouterLink>
      </div>
    </div>

    <div class="container home__body">
      <div class="home__cards">
        <div class="card home__info-card">
          <div class="home__icon" aria-hidden="true">❄️</div>
          <h3>{{ $t('options.need_type.ac_cooling') }}</h3>
          <p>Air conditioning units, cooling assistance, and energy programs</p>
        </div>
        <div class="card home__info-card">
          <div class="home__icon" aria-hidden="true">🔥</div>
          <h3>{{ $t('options.need_type.heating') }}</h3>
          <p>Fuel assistance, heating system repair, and winter energy programs</p>
        </div>
        <div class="card home__info-card">
          <div class="home__icon" aria-hidden="true">🏠</div>
          <h3>{{ $t('options.need_type.home_repair_efficiency') }}</h3>
          <p>Weatherization, home repairs, and energy efficiency improvements</p>
        </div>
      </div>

      <div class="home__start-section">
        <p class="home__start-text">{{ $t('ui.start_subtitle') }}</p>
        <RouterLink to="/questionnaire" class="btn btn--primary btn--full">
          {{ $t('ui.start_button') }}
        </RouterLink>
        <RouterLink to="/caseworker" class="btn btn--outline btn--full home__cw-link">
          {{ $t('ui.caseworker_toggle_on') }}
        </RouterLink>
      </div>

      <p class="home__contact">
        Need immediate help? Call <strong>703-222-0880</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Preload data in background when user lands on home page
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEligibilityStore } from '@/stores/eligibility'

const { locale } = useI18n()
const store = useEligibilityStore()

onMounted(() => {
  // Pre-fetch programs so questionnaire starts instantly
  store.loadData(locale.value)
})
</script>

<style scoped>
.home__hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: white;
  padding: var(--sp-12) 0;
  text-align: center;
}

.home__title {
  color: white;
  margin-bottom: var(--sp-4);
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

.home__subtitle {
  font-size: var(--text-lg);
  opacity: 0.9;
  margin-bottom: var(--sp-8);
}

.home__cta {
  font-size: var(--text-lg);
  padding: 1rem 2rem;
}

.home__body {
  padding-top: var(--sp-8);
  padding-bottom: var(--sp-12);
}

.home__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sp-4);
  margin-bottom: var(--sp-8);
  text-align: center;
}

.home__info-card { padding: var(--sp-6) var(--sp-4); }
.home__icon { font-size: 2.5rem; margin-bottom: var(--sp-3); }
.home__info-card h3 { font-size: var(--text-base); margin-bottom: var(--sp-2); }
.home__info-card p { font-size: var(--text-sm); color: var(--color-text-muted); }

.home__start-section {
  max-width: 400px;
  margin: 0 auto var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  text-align: center;
}

.home__start-text {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.home__cw-link { font-size: var(--text-sm); }

.home__contact {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
