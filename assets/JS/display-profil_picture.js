document.addEventListener('DOMContentLoaded', () => {
  const photo_section = document.getElementById('project-section');
  const columns = 3;
  const colDivs = [];

  // créer 3 colonnes vides
  for (let i = 0; i < columns; i++) {
    const col = document.createElement('div');
    col.classList.add('masonry-col');
    photo_section.appendChild(col);
    colDivs.push(col);
  }

  fetch('assets/JS/folders-profil_picture.json')
    .then(res => res.json())
    .then(folders => {
      elements = folders[window.location.hash.substring(1)];
        document.getElementById('project_page_title').innerHTML =  elements["title"];
        document.getElementById('project-page-description').innerHTML =  elements["description"];
        elements["images"].forEach((img, index) => {
          const imageEl = document.createElement('img');
          imageEl.src = `assets/images/${elements['project_name']}/${img}`;
          imageEl.alt = img;

          // Ajouter la classe hover-target
          imageEl.classList.add('hover-target');

          // placer dans une colonne en fonction de l'index
          colDivs[index % columns].appendChild(imageEl);
        });
    })
    .catch(err => console.error(err));
});

