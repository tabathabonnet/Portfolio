document.addEventListener('DOMContentLoaded', () => {
  const photo_section = document.getElementById('photography-section');
  const photo_filter = document.getElementById('photo-filter');

  fetch('assets/JS/folders-photography.json')
    .then(res => res.json())
    .then(folders => {
      let new_html_section = '';
      let new_html_filter = '';

      Object.keys(folders).forEach(project_name => {
        const images = folders[project_name];
        if (!images.length) return;

        // Crée le bloc du projet
        new_html_section += `<div id="${project_name}">`;
        new_html_section += `<div class="container"><h3>${project_name}</h3></div>`;
        new_html_section += `<div class="container-img">`;

        // Déterminer le nombre de colonnes (ici 3)
        
        const numCols = 3;
        const cols = Array.from({ length: numCols }, () => []);

        // Répartir les images en colonnes pour garder l'ordre
        images.forEach((img, index) => {
          cols[index % numCols].push(img);
        });

        // Générer le HTML pour chaque colonne
        cols.forEach(col => {
          new_html_section += `<div class="masonry-col">`;
          col.forEach(img => {
            new_html_section += `<img src="assets/images/${project_name}/${img}" alt="${img}" class="hover-target image-container">`;
          });
          new_html_section += `</div>`;
        });

        new_html_section += `</div></div>`;

        // Boutons filtre
        const categories = Object.keys(folders);
        const arrString = "[" + categories.map(e => `'${e}'`).join(",") + "]";
        new_html_filter += `<button onclick="display_photo_category('${project_name}', ${arrString});" id="${project_name}-btn">${project_name}</button>`;
      });

      photo_section.innerHTML = new_html_section;
      photo_filter.innerHTML = new_html_filter;
    })
    .catch(err => console.error(err));
});
