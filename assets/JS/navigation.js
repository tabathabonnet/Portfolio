
/*cursor*/

document.addEventListener('DOMContentLoaded', async () => {
  const customCursor = document.getElementById('custom-cursor');
  const innerCircle = document.getElementById('inner-circle');

  document.addEventListener('mousemove', (e) => {
    const cursorSize = customCursor.clientWidth / 2;
    customCursor.style.left = `${e.clientX - cursorSize}px`;
    customCursor.style.top = `${e.clientY - cursorSize}px`;
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const hoverTargets = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], .hover-target, h1, a');
  console.log(hoverTargets);
  hoverTargets.forEach(target => {
    target.addEventListener('mouseenter', () => {
      customCursor.classList.add('hover');
    });
    target.addEventListener('mouseleave', () => {
      customCursor.classList.remove('hover');
    });
  });

  const hoverTargets2 = document.querySelectorAll('a');
  hoverTargets2.forEach(target => {
    target.addEventListener('mouseenter', () => {
      customCursor.classList.add('hover-test');
    });
    target.addEventListener('mouseleave', () => {
      customCursor.classList.remove('hover-test');
    });
  });
});

/*cursor*/

/*to top button*/

jQuery(function(){
    $(function () {
        $(window).scroll(function () { //Fonction appelée quand on descend la page
            if ($(this).scrollTop() > 200 ) {  // Quand on est à 200pixels du haut de page,
                $('#scrollUp').css('right','10px'); // Replace à 10pixels de la droite l'image
            } else { 
                $('#scrollUp').removeAttr( 'style' ); // Enlève les attributs CSS affectés par javascript
            }
        });
    });
});



