const elToaster = document.getElementById("toaster");

export const toast = (() => {
  const create = (message) => {
    const elToast = document.createElement("div");
    elToast.className = "toast";
    elToast.textContent = message;
    return elToast;
  };

  const display = (elToast) => {
    elToaster.append(elToast);

    setTimeout(() => {
      elToast.classList.add("animate-out");
      elToast.ontransitionend = () => elToast.remove();
    }, 2000);
  };

  return {
    info: (message) => {
      const elToast = create(message);
      elToast.classList.add("info");
      display(elToast);
    },
    success: (message) => {
      const elToast = create(message);
      elToast.classList.add("success");
      display(elToast);
    },
    error: (message) => {
      const elToast = create(message);
      elToast.classList.add("error");
      display(elToast);
    },
  };
})();
