import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Users = () => {
  const { user, updateUser, blockUser, unblockUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.id);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = async (userId) => {
    try {
      await updateUser(userId, editForm);
      await loadUsers();
      setEditingUser(null);
      alert('✅ Пользователь обновлен');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления');
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    const action = isBlocked ? 'разблокировать' : 'заблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${action} этого пользователя?`)) return;

    try {
      if (isBlocked) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
      await loadUsers();
      alert(`✅ Пользователь ${action}н`);
    } catch (err) {
      setError(err.response?.data?.error || `Ошибка ${action} пользователя`);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return { bg: '#dc3545', color: 'white' };
      case 'seller': return { bg: '#ffc107', color: '#333' };
      default: return { bg: '#6c757d', color: 'white' };
    }
  };

  if (loading) return (
    <div style={styles.loading}>
      <div style={styles.spinner}></div>
      <p>Загрузка пользователей...</p>
    </div>
  );

  if (user?.role !== 'admin') {
    return (
      <div style={styles.error}>
        <h2>⛔ Доступ запрещен</h2>
        <p>Только администраторы могут просматривать эту страницу</p>
        <Link to="/products" style={styles.backLink}>Вернуться к товарам</Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/products" style={styles.backButton}>← Назад к товарам</Link>
        <h1 style={styles.title}>👥 Управление пользователями</h1>
        <div style={styles.userInfo}>
          <span style={styles.welcomeText}>
            Администратор: {user?.first_name} {user?.last_name}
          </span>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{users.length}</span>
          <span style={styles.statLabel}>Всего пользователей</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{users.filter(u => u.role === 'admin' && !u.isBlocked).length}</span>
          <span style={styles.statLabel}>Активных админов</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{users.filter(u => u.role === 'seller' && !u.isBlocked).length}</span>
          <span style={styles.statLabel}>Активных продавцов</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{users.filter(u => !u.isBlocked).length}</span>
          <span style={styles.statLabel}>Активных пользователей</span>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Имя</th>
              <th style={styles.th}>Фамилия</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Роль</th>
              <th style={styles.th}>Статус</th>
              <th style={styles.th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleStyle = getRoleColor(u.role);
              const isEditing = editingUser === u.id;
              const isCurrentUser = u.id === user?.id;

              return (
                <tr key={u.id} style={u.isBlocked ? styles.blockedRow : styles.tableRow}>
                  <td style={styles.td}>{u.id.substring(0, 8)}...</td>
                  <td style={styles.td}>
                    {isEditing ? (
                      <input
                        type="text"
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleEditChange}
                        style={styles.editInput}
                      />
                    ) : u.first_name}
                  </td>
                  <td style={styles.td}>
                    {isEditing ? (
                      <input
                        type="text"
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleEditChange}
                        style={styles.editInput}
                      />
                    ) : u.last_name}
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    {isEditing ? (
                      <select
                        name="role"
                        value={editForm.role}
                        onChange={handleEditChange}
                        style={styles.select}
                      >
                        <option value="user">Пользователь</option>
                        <option value="seller">Продавец</option>
                        <option value="admin">Администратор</option>
                      </select>
                    ) : (
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: roleStyle.bg,
                        color: roleStyle.color
                      }}>
                        {u.role === 'admin' ? '👑 Админ' : u.role === 'seller' ? '📦 Продавец' : '👤 Пользователь'}
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: u.isBlocked ? '#dc3545' : '#28a745'
                    }}>
                      {u.isBlocked ? '🔒 Заблокирован' : '✅ Активен'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleEditSubmit(u.id)}
                            style={styles.saveAction}
                            title="Сохранить"
                          >
                            💾
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            style={styles.cancelAction}
                            title="Отмена"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(u)}
                            style={styles.editAction}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? "Нельзя редактировать себя" : "Редактировать"}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleBlockUser(u.id, u.isBlocked)}
                            style={u.isBlocked ? styles.unblockAction : styles.blockAction}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? "Нельзя блокировать себя" : (u.isBlocked ? "Разблокировать" : "Заблокировать")}
                          >
                            {u.isBlocked ? '🔓 Разблокировать' : '🔒 Заблокировать'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  backButton: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '16px',
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
  },
  title: {
    fontSize: '24px',
    color: '#333',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: '14px',
    color: '#666',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e0e0e0',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  blockedRow: {
    borderBottom: '1px solid #f0f0f0',
    backgroundColor: '#ffebee',
  },
  td: {
    padding: '15px',
    verticalAlign: 'middle',
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    color: 'white',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  editAction: {
    padding: '6px 10px',
    backgroundColor: '#ffc107',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  blockAction: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
    fontSize: '12px',
  },
  unblockAction: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
    fontSize: '12px',
  },
  saveAction: {
    padding: '6px 10px',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelAction: {
    padding: '6px 10px',
    backgroundColor: '#6c757d',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editInput: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
  },
  select: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    margin: '20px auto',
  },
  error: {
    textAlign: 'center',
    padding: '50px',
    color: '#dc3545',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  backLink: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
  },
};

export default Users;