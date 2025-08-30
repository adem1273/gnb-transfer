import React from 'react';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-white p-4 text-center">
      &copy; 2025 GNB Transfer. {t('footer.allRightsReserved')}
    </footer>
  );
}

export default Footer;