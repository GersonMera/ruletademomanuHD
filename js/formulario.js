function obtenerUsuariosDeGoogleSheets() {
    const url = 'https://script.google.com/macros/s/AKfycbwRu_rey6sEAvOGzYBjr6GeFZC90aD9_CFx4jxTpSXJp_FO58GWpP-SfnyzGlW7EdPWmA/exec'; // Reemplaza con tu URL
    fetch(url)
      .then(response => response.json())
      .then(data => {
        mostrarUsuarios(data);
      })
      .catch(error => console.error('Error al obtener datos de Google Sheets:', error));
  }
  
  function mostrarUsuarios(usuarios) {
    const tbody = document.getElementById('usuarios-body');
    tbody.innerHTML = ''; // Limpiar la tabla
  
    if (usuarios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2">No hay usuarios registrados</td></tr>';
    } else {
      usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${usuario.dni}</td>
          <td>${new Date(usuario.fechaRegistro).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
  
  document.addEventListener('DOMContentLoaded', obtenerUsuariosDeGoogleSheets);