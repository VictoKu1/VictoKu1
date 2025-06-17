/**
 * Dynamically generates and appends a JSON-LD script element containing structured data
 * for SEO purposes. The data conforms to Schema.org's "Person" type and provides information
 */
(function () {
  // Define the structured data object according to Schema.org guidelines.
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Victor Kushnir',
    url: 'https://victoku1.netlify.app/',
    sameAs: [
      'https://github.com/VictoKu1',
      'https://linkedin.com/in/victoku1',
      'https://victoku1.github.io/VictoKu1/'
    ],
    jobTitle: 'Software Engineer & Game Developer',
    worksFor: {
      '@type': 'Organization',
      name: 'Independent Developer'
    }
  };

  // Create the JSON-LD script element.
  const scriptEl = document.createElement('script');
  scriptEl.type = 'application/ld+json';
  scriptEl.text = JSON.stringify(structuredData);

  // Append the script element to the document's <head>.
  document.head.appendChild(scriptEl);
})();
