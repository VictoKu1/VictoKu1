// Create the JSON-LD script element
const script = document.createElement("script");
script.type = "application/ld+json";

// Add structured data as a JSON string
script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Victor Kushnir",
    "url": "https://victoku1.netlify.app/",
    "sameAs": [
        "https://github.com/VictoKu1",
        "https://linkedin.com/in/victoku1",
        "https://victoku1.github.io/VictoKu1/"
    ],
    "jobTitle": "Software Engineer & Game Developer",
    "worksFor": {
        "@type": "Organization",
        "name": "Independent Developer"
    }
});

// Append it to the `<head>` of the document
document.head.appendChild(script);
