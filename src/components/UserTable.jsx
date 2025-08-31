import React from 'react';
import { useTranslation } from 'react-i18next'; // <-- Yeni import

function UserTable({ users }) {
    const { t } = useTranslation(); // <-- useTranslation hook'unu kullan

    return (
        <table className="w-full border">
            <thead>
                <tr className="bg-gray-700 text-white">
                    <th className="p-2">{t('userTable.name')}</th>
                    <th className="p-2">{t('userTable.email')}</th>
                    <th className="p-2">{t('userTable.role')}</th>
                </tr>
            </thead>
            <tbody>
                {users.map(u => (
                    <tr key={u._id} className="border-b">
                        <td className="p-2">{u.name}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default UserTable;