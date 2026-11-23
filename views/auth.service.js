import axios from 'axios';

class AuthService {
  login(email, password) {
    return axios
      .post('https://softinsa-api-riya.onrender.com/users/login', { email, password })
      .then((res) => {
          if (res.data.token) {
            const userObj = {
              ...res.data,
              ...res.data.user // Permite que chamadas a userLocal.ID_UTILIZADOR e userLocal.user.ID_UTILIZADOR funcionem
            };
            sessionStorage.setItem('user', JSON.stringify(userObj));
          }
          return res.data;
      });
  }

  logout() {
    sessionStorage.removeItem('user');
  }

  getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('user'));
  }
}

export default new AuthService();
