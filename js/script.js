const workList = document.querySelector(".work__list");

const navSlide = () => {
  const hamburger = document.querySelector(".hamburger");
  const navList = document.querySelector(".nav__list");
  const navLinks = document.querySelectorAll(".nav__item a");

  hamburger.addEventListener("click", () => {
    navList.classList.toggle("nav-active");

    navLinks.forEach((link, index) => {
      if (link.style.animation) {
        link.style.animation = "";
      } else {
        link.style.animation = `navLinkFade 0.5s ease forwards ${
          index / 7 + 0.5
        }s`;
      }
    });
    hamburger.classList.toggle("toggle");
  });
};

const app = () => {
  navSlide();
};

app();

function renderWork(array, node) {
  array.forEach((element) => {
    const workItem = document.createElement("li");
    workItem.classList.add("work__item");

    workItem.innerHTML = `
      <div class="work__wrapper">
        <div class="work__inner">
          <img src="${element.icon}" alt="${element.name}" class="work__img" />
          <p class="work__title">${element.name}</p>
        </div>
        <a href="${element.url}" target="_blank" class="work__link">View Live</a>
      </div>
      <ul class="work__types">
        <li class="work__type">${element.type[0]}</li>
        <li class="work__type">${element.type[1]}</li>
        <li class="work__type">${element.type[2]}</li>
        <li class="work__type">${element.type[3]}</li>
      </ul>
      <div class="work__pic">
        <img src="${element.img}" alt="${element.name}" class="work__pics" />
      </div>
    `;

    node.append(workItem);
  });
}

renderWork(works, workList);

