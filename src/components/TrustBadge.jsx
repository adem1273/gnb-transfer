import React from 'react';
import { motion } from 'framer-motion';

function TrustBadge({ title, description, icon }) {
  return (
    <motion.div 
      className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 text-center max-w-sm mx-auto border border-gray-100"
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {icon && (
        <div className="text-5xl mb-4">{icon}</div>
      )}
      <div className="w-16 h-1 bg-blue-600 mx-auto mb-4 rounded-full"></div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default TrustBadge;