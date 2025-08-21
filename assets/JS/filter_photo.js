
function display_photo_category(categoryClicked, allCategories) {
  const categories = allCategories;
  const clickedDiv = document.getElementById(categoryClicked);
  
  // 1. Si déjà sélectionné → réaffiche tout et quitte
  if (clickedDiv.classList.contains('selected')) {
    categories.forEach(cat => {
      document.getElementById(cat).style.display = "block";
      document.getElementById(cat).classList.remove('selected');
      const btn = document.getElementById(cat + '-btn');
      if (btn) btn.classList.remove('selected');
    });
    return;
  }

  // 2. Sinon → réinitialise tout
  categories.forEach(cat => {
    document.getElementById(cat).style.display = "none";
    document.getElementById(cat).classList.remove('selected');
    const btn = document.getElementById(cat + '-btn');
    if (btn) btn.classList.remove('selected');
  });

  // 3. Affiche la catégorie choisie
  clickedDiv.style.display = "block";
  clickedDiv.classList.add('selected');
  const clickedBtn = document.getElementById(categoryClicked + '-btn');
  if (clickedBtn) clickedBtn.classList.add('selected');
}




