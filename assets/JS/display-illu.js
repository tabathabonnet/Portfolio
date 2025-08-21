document.addEventListener('DOMContentLoaded', () => {
  const photo_section = document.getElementById('illustration-section');
  const columns = 3;
  const colDivs = [];

  // créer 3 colonnes vides
  for (let i = 0; i < columns; i++) {
    const col = document.createElement('div');
    col.classList.add('masonry-col');
    photo_section.appendChild(col);
    colDivs.push(col);
  }

  fetch('assets/JS/folders-illustration.json')
    .then(res => res.json())
    .then(folders => {
      for (const [project_name, images] of Object.entries(folders)) {
        images.forEach((img, index) => {
          const imageEl = document.createElement('img');
          imageEl.src = `assets/images/${project_name}/${img}`;
          imageEl.alt = img;

          // Ajouter la classe hover-target
          imageEl.classList.add('hover-target');

          // placer dans une colonne en fonction de l'index
          colDivs[index % columns].appendChild(imageEl);
        });
      }
    })
    .catch(err => console.error(err));
});

