document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const messageContainer = document.getElementById('message-container');
    const fileListContainer = document.getElementById('file-list-container');
    const headerContainer = document.getElementById('header-container');

    // Cargar el header (asumiendo que tienes un header.html)
    fetch('../header.html') // Ajusta la ruta si header.html está en otra ubicación
        .then(response => {
            if (!response.ok) {
                console.error('Error al cargar header.html:', response.status);
                return ''; // Devuelve una cadena vacía para no romper la página
            }
            return response.text();
        })
        .then(data => {
            if (headerContainer) {
                headerContainer.innerHTML = data;
            } else {
                console.error('No se encontró el elemento con ID "header-container".');
            }
        })
        .catch(error => {
            console.error('Error al cargar el header:', error);
        });

    // Función para cargar la lista de archivos
    window.loadFileList = function() {
        fetch('../php/subir_archivo.php?listFiles')
            .then(response => response.json())
            .then(data => {
                fileListContainer.innerHTML = ''; // Limpiar la lista anterior
                if (data.files && data.files.length > 0) {
                    const table = document.createElement('table');
                    table.border = '1';
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    const headers = ['Nombre del archivo', 'Acción'];
                    headers.forEach(headerText => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');
                    data.files.forEach(fileName => {
                        const row = document.createElement('tr');
                        const nameCell = document.createElement('td');
                        nameCell.textContent = fileName;
                        row.appendChild(nameCell);

                        const actionCell = document.createElement('td');
                        const viewButton = document.createElement('button');
                        viewButton.classList.add('button', 'view-btn');
                        viewButton.textContent = 'Ver';
                        viewButton.addEventListener('click', () => {
                            window.open('../uploads/' + fileName, '_blank');
                        });
                        actionCell.appendChild(viewButton);

                        const deleteButton = document.createElement('button');
                        deleteButton.classList.add('button', 'delete-btn');
                        deleteButton.textContent = 'Eliminar';
                        deleteButton.addEventListener('click', () => {
                            if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
                                deleteFile(fileName);
                            }
                        });
                        actionCell.appendChild(deleteButton);

                        row.appendChild(actionCell);
                        tbody.appendChild(row);
                    });
                    table.appendChild(tbody);
                    fileListContainer.appendChild(table);
                } else {
                    fileListContainer.innerHTML = '<p>No hay archivos PDF subidos aún.</p>';
                }
            })
            .catch(error => {
                console.error('Error al cargar la lista de archivos:', error);
                fileListContainer.innerHTML = '<p class="error">Error al cargar la lista de archivos.</p>';
            });
    };

    // Función para eliminar un archivo
    function deleteFile(fileName) {
        const formData = new FormData();
        formData.append('deleteFile', fileName);

        fetch('../php/subir_archivo.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            messageContainer.innerHTML = `<div class="message ${data.status}">${data.message}</div>`;
            // Recargar la lista de archivos después de la eliminación exitosa
            if (data.status === 'success') {
                loadFileList();
            }
        })
        .catch(error => {
            console.error('Error al eliminar el archivo:', error);
            messageContainer.innerHTML = '<div class="message error">Error al comunicar con el servidor.</div>';
        });
    }

    // Inicializar la carga de la lista de archivos al cargar la página
    if (fileListContainer) {
        loadFileList();
    } else {
        console.error('No se encontró el elemento con ID "file-list-container".');
    }

    // Manejar el envío del formulario de subida
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Evitar la recarga de la página

            const formData = new FormData(uploadForm);

            fetch('../php/subir_archivo.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                messageContainer.innerHTML = `<div class="message ${data.status}">${data.message}</div>`;
                // Recargar la lista de archivos después de la subida exitosa
                if (data.status === 'success') {
                    loadFileList();
                }
            })
            .catch(error => {
                console.error('Error al subir el archivo:', error);
                messageContainer.innerHTML = '<div class="message error">Error al comunicar con el servidor.</div>';
            });
        });
    } else {
        console.error('No se encontró el elemento con ID "uploadForm".');
    }
});