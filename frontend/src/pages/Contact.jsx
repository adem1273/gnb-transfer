import React from 'react';
import { Helmet } from 'react-helmet';

function Contact() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Helmet>
        <title>GNB Transfer | Contact</title>
        <meta name="description" content="Contact GNB Transfer for airport transfers and tours." />
      </Helmet>

      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      <p>Email: support@gnbpro.com</p>
      <p>Phone: +90 555 123 4567</p>
    </div>
  );
}

export default Contact;
