// este header es el viejo que yo hice, anda lentisimo y no carga los botones. hay que borrarlo no sirve para nada
//es una de las primeras versiones que hice del head
fetch('./Templates/header.html', { cache: 'force-cache' })
  .then(response => response.clone())
  .then(clone => clone.text())
  .then(html => {
    const header = document.createElement('div');
    header.innerHTML = html;
    const headerElement = header.querySelector('#header');
    const headerContainer = document.getElementById('header-container');
    const script = document.createElement('script');
    script.src = '/scrips/btnHeader.js';
    headerContainer.appendChild(headerElement);
  });
/*fetch('./Templates/header.html').then(response => response.text()).then(html =>
    { const header = document.createElement('div');
        header.innerHTML = html;
        const headerElement = header.querySelector('#header');
        const headerContainer = document.getElementById('header-container');
        headerContainer.appendChild(headerElement); 
    }
);*/






