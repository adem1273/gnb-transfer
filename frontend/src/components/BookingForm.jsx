import React, { useState } from 'react';

function BookingForm({ onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        tourId: '',
        date: '',
        guests: 1,
        paymentMethod: 'cash' // Yeni state: Varsayılan olarak nakit
    });

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded">
            <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full p-2 mb-2" />
            <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 mb-2" />
            <input name="tourId" placeholder="Tour ID" value={formData.tourId} onChange={handleChange} className="w-full p-2 mb-2" />
            <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full p-2 mb-2" />
            <input name="guests" type="number" min="1" value={formData.guests} onChange={handleChange} className="w-full p-2 mb-2" />

            {/* Yeni Ödeme Yöntemi Alanı */}
            <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Payment Method
                </label>
                <select 
                    name="paymentMethod" 
                    value={formData.paymentMethod} 
                    onChange={handleChange} 
                    className="w-full p-2 border rounded"
                >
                    <option value="cash">Cash on Arrival</option>
                    <option value="credit_card">Credit Card (Online)</option>
                </select>
            </div>

            <button type="submit" className="bg-blue-600 text-white p-2 w-full">Book Now</button>
        </form>
    );
}

export default BookingForm;