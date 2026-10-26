// Public API of the home page: wires every section, top to bottom.
import { initChapters, initReveal, initVideoFacades } from '../../shared/ui/index.js';
import { initIntro } from './ui/intro/intro.js';
import { initHeader } from './ui/header/header.js';
import { initHero } from './ui/hero/hero.js';
import { initChooser } from './ui/chooser/chooser.js';
import { initInterludes } from './ui/interlude/interlude.js';
import { initCampus } from './ui/campus/campus.js';
import { initStudyFilm } from './ui/interlude/study-film.js';
import { initOdometers } from './ui/package/odometer.js';
import { initPriceCard } from './ui/package/price-card.js';
import { initDirectorSheet } from './ui/directors/director-sheet.js';
import { initTutors } from './ui/tutors/tutors.js';
import { initVoyage } from './ui/how-it-works/voyage.js';
import { initTradewind } from './ui/tradewind/tradewind.js';
import { initResults } from './ui/results/results.js';
import { initPathwayMap } from './ui/consult/pathway-map.js';
import { initConsultForm } from './ui/consult/consult-form.js';
import { initContactDock } from './ui/contact-dock/contact-dock.js';
import { initFooter } from './ui/footer/footer.js';
import { initStack } from './ui/stack/stack.js';
import { initSettle } from './ui/stack/settle.js';

export function initHomePage() {
  initIntro();
  initHeader();
  initHero();
  initChooser();
  initInterludes();
  initStudyFilm();
  initCampus();
  initOdometers();
  initPriceCard();
  initDirectorSheet();
  initTutors();
  initVoyage();
  initTradewind();
  initResults();
  initPathwayMap();
  initConsultForm();
  initContactDock();
  initFooter();
  initStack();
  initSettle();
  initVideoFacades();
  initChapters();
  initReveal();
}
