import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await API.get('/tours');
        setTours(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load tours.');
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  if (loading) {
    return <Loading message="Loading tours..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{t('tours.managementTitle')}</h2>
      <Link to="/admin/tours/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4 inline-block">
        {t('buttons.createTour')}
      </Link>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded shadow-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="p-2 border-b-2 text-left">{t('tours.title')}</th>
              <th className="p-2 border-b-2 text-left">{t('tours.price')}</th>
              <th className="p-2 border-b-2 text-left">{t('tours.duration')}</th>
              <th className="p-2 border-b-2 text-left">{t('tours.discount')}</th>
              <th className="p-2 border-b-2 text-left">{t('tours.isCampaign')}</th>
              <th className="p-2 border-b-2 text-left">{t('tours.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {tours.map(tour => (
              <tr key={tour._id} className="border-b hover:bg-gray-50">
                <td className="p-2 border">{tour.title}</td>
                <td className="p-2 border">${tour.price}</td>
                <td className="p-2 border">{tour.duration} {t('tours.days')}</td>
                <td className="p-2 border">{tour.discount}%</td>
                <td className="p-2 border">{tour.isCampaign ? 'Yes' : 'No'}</td>
                <td className="p-2 border space-x-2">
                  <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                    {t('buttons.edit')}
                  </button>
                  <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                    {t('buttons.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tours;