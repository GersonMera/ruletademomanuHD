document.addEventListener('DOMContentLoaded', function () {
  let db;
  const dbName = "RuletaPremiosDB";
  const registroContainer = document.getElementById('registro-container');
  const ruletaContainer = document.getElementById('ruleta-container');
  const dniInput = document.getElementById('dni-input');
  const registroButton = document.getElementById('registro-button');
  const wheel = document.getElementById('wheel');
  const spinButton = document.getElementById('spin-button');
  const spinSound = document.getElementById('spin-sound');
  const winnerSound = document.getElementById('winner-sound');
  const result = document.getElementById('result');
  const handAnimation = document.getElementById('hand'); // Agregada aquí
  let canSpin = true;
  const premioPopup = document.getElementById('premio-popup');
  const premioMensaje = document.getElementById('premio-mensaje');

  let userDni = '';
  let premiosGanados = []; // Array para almacenar los premios ganados

  function ajustarRueda() {
    const wheelContainer = document.querySelector('.wheel-container');
    const width = window.innerWidth;

    if (width <= 480) {
      wheelContainer.style.width = '200px';
      wheelContainer.style.height = '200px';
    } else if (width <= 768) {
      wheelContainer.style.width = '250px';
      wheelContainer.style.height = '250px';
    } else {
      wheelContainer.style.width = '300px';
      wheelContainer.style.height = '300px';
    }
  };

  window.addEventListener('resize', ajustarRueda);
  document.addEventListener('DOMContentLoaded', ajustarRueda);

  function initDB() {
    const request = indexedDB.open(dbName, 1);

    request.onerror = function(event) {
      console.error("Error al abrir la base de datos:", event.target.error);
    };

    request.onsuccess = function(event) {
      db = event.target.result;
      console.log("Base de datos abierta con éxito");
    };

    request.onupgradeneeded = function(event) {
      db = event.target.result;
      const objectStore = db.createObjectStore("usuarios", { keyPath: "dni" });
      objectStore.createIndex("dni", "dni", { unique: true });
      console.log("Object store creado");
    };
  }

  initDB();

  function registrarUsuario(dni) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["usuarios"], "readwrite");
      const objectStore = transaction.objectStore("usuarios");
      const usuario = { dni: dni, fechaRegistro: new Date().toISOString(), giros: 0 };
      const request = objectStore.add(usuario);

      request.onerror = function(event) {
        console.error("Error al añadir usuario:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = function(event) {
        console.log("Usuario registrado con DNI:", dni);
        enviarDatosAGoogleSheets(usuario);
        resolve(dni);
      };
    });
  };

  function enviarDatosAGoogleSheets(usuario) {
    const url = 'https://script.google.com/macros/s/AKfycbwRu_rey6sEAvOGzYBjr6GeFZC90aD9_CFx4jxTpSXJp_FO58GWpP-SfnyzGlW7EdPWmA/exec';
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usuario),
    })
    .then(response => console.log('Datos enviados a Google Sheets'))
    .catch(error => console.error('Error al enviar datos a Google Sheets:', error));
  };

  function verificarUsuario(dni) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["usuarios"]);
      const objectStore = transaction.objectStore("usuarios");
      const request = objectStore.get(dni);

      request.onerror = function(event) {
        console.error("Error al obtener usuario:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = function(event) {
        resolve(request.result);
      };
    });
  };

  function actualizarGirosUsuario(dni, nuevoGiros) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["usuarios"], "readwrite");
      const objectStore = transaction.objectStore("usuarios");
      const request = objectStore.get(dni);

      request.onerror = function(event) {
        console.error("Error al obtener usuario:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = function(event) {
        const usuario = request.result;
        usuario.giros = nuevoGiros;
        const updateRequest = objectStore.put(usuario);

        updateRequest.onerror = function(event) {
          console.error("Error al actualizar los giros del usuario:", event.target.error);
          reject(event.target.error);
        };

        updateRequest.onsuccess = function() {
          console.log("Número de giros actualizado para el usuario con DNI:", dni);
          resolve();
        };
      };
    });
  };

  function mostrarPremio(premio) {
    premiosGanados.push(premio); // Agregar el premio al array de premios ganados
    premioMensaje.textContent = `Has ganado: ${premio}`;
    premioPopup.style.display = 'flex';

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      premioPopup.style.display = 'none';

      if (premiosGanados.length === 2) { // Enviar mensaje si ya ganó dos premios
        const mensaje = encodeURIComponent(`¡Felicidades! Has ganado los siguientes premios: ${premiosGanados.join(', ')}. Tu DNI es ${userDni}.`);
        const url = `https://wa.me/51962623633?text=${mensaje}`;
        window.location.href = url;
      }

    }, 5000);
  };

  function validarDNI(dni) {
    return /^\d{8}$/.test(dni);
  };

  function showHand() {
    handAnimation.classList.remove('hidden'); // Mostrar la mano
  }

  function hideHand() {
    handAnimation.classList.add('hidden'); // Ocultar la mano
  }

  registroButton.addEventListener('click', function () {
    const dni = dniInput.value.trim();
    if (validarDNI(dni)) {
      verificarUsuario(dni).then(usuario => {
        if (usuario) {
          alert('Este DNI ya está registrado.');
        } else {
          registrarUsuario(dni).then(() => {
            userDni = dni;
            registroContainer.classList.add('fade-out');
            setTimeout(() => {
              registroContainer.style.display = 'none';
              ruletaContainer.style.display = 'block';
              ruletaContainer.classList.add('slide-in');
              showHand(); // Mostrar la mano al cargar la ruleta
            }, 1000);
          }).catch(error => {
            alert('Error al registrar el usuario: ' + error);
          });
        }
      }).catch(error => {
        alert('Error al verificar el usuario: ' + error);
      });
    } else {
      alert('Por favor, ingrese un DNI válido de 8 dígitos.');
    }
  });

  wheel.addEventListener('click', function () {
    if (!canSpin) return;

    verificarUsuario(userDni).then(usuario => {
        if (usuario.giros >= 2) {
            alert('Ya has girado la ruleta dos veces. No puedes girar más.');
            return;
        }

        hideHand(); // Ocultar la mano al comenzar a girar

        // Desactivar temporalmente la transición para reiniciar la ruleta
        wheel.style.transition = 'none';
        wheel.style.transform = 'rotate(0deg)';

        // Asegurarse de que el reinicio se aplique correctamente
        setTimeout(() => {
            canSpin = false;
            result.textContent = '';

            const segments = document.querySelectorAll('.segment');
            const degreesPerSegment = 360 / segments.length;
            const randomDegrees = Math.floor(Math.random() * 360) + 1800 + Math.random() * 360;

            // Reactivar la transición para el giro
            wheel.style.transition = 'transform 5s ease-out';
            wheel.style.transform = `rotate(${randomDegrees}deg)`;
            spinSound.play();

            setTimeout(() => {
                spinSound.pause();
                spinSound.currentTime = 0;

                const actualDegrees = randomDegrees % 360;
                const winningSegmentIndex = Math.floor(actualDegrees / degreesPerSegment);
                const winningPrize = segments[winningSegmentIndex].getAttribute('data-prize');

                winnerSound.play();

                const nuevoGiros = usuario.giros + 1;
                actualizarGirosUsuario(userDni, nuevoGiros).then(() => {
                    canSpin = true;
                    showHand(); // Mostrar la mano después de que la ruleta se detiene

                    mostrarPremio(winningPrize);
                });

            }, 5000);
        }, 50); // Esperar un tiempo mínimo antes de reiniciar el giro

    }).catch(error => {
        alert('Error al verificar el número de giros: ' + error);
    });
  });
});
