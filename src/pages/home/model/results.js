/* Results: add real, verifiable numbers here. While every list is empty the section stays hidden
   on the live site (a SAMPLE shows on localhost so the layout can be reviewed). Never invent figures. */
export const RESULTS = {
  admits: [],   // e.g. { uni: 'University of Oxford', count: 3, year: '2026' }
  stats: [],    // e.g. { value: 92, suffix: '%', label: 'raised at least one predicted grade within one package' }
  rates: [],    // e.g. { uni: 'Oxbridge', average: 17, polaris: 40 }  (published rate vs Polaris, same year)
};

export const SAMPLE = {
  admits: ['Oxford', 'Cambridge', 'Imperial', 'UCL', 'LSE', 'NUS', 'UC Berkeley', 'UCLA'].map(uni => ({ uni, count: 0 })),
  stats: [{ value: 0, suffix: '%', label: 'Sample: share of students who raised a predicted grade' }, { value: 0, label: 'Sample: university offers this cycle' }],
  rates: ['Oxbridge', 'Imperial', 'UCL'].map(uni => ({ uni, average: 0, polaris: 0 })),
};

export const hasResults = () => RESULTS.admits.length > 0 || RESULTS.stats.length > 0 || RESULTS.rates.length > 0;
