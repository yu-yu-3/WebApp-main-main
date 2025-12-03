import React from 'react';
import './EventsManagement.css';

const EventsManagement = () => {
  return (
    <div className="events-management">
      <div className="events-header">
        <h2>Управление мероприятиями и акциями</h2>
        <button className="btn-add">
          + Добавить мероприятие/акцию
        </button>
      </div>
      
      <div className="events-table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Дата</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Новый год в Matreshka</td>
              <td>🎭 Мероприятие</td>
              <td>31.12.2024</td>
              <td>✅ Активно</td>
              <td>
                <button>✏️</button>
                <button>🗑️</button>
              </td>
            </tr>
            <tr>
              <td>Скидка 20%</td>
              <td>🎁 Акция</td>
              <td>01-31.12.2024</td>
              <td>✅ Активно</td>
              <td>
                <button>✏️</button>
                <button>🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventsManagement;