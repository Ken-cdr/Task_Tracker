document.addEventListener("DOMContentLoaded", function () {
            const modal = document.getElementById("descriptionModal");

            modal.addEventListener("show.bs.modal", function (event) {
                const trigger = event.relatedTarget;
                const description = trigger.getAttribute("data-description");
                document.getElementById("modalDescription").textContent = description;
            });
        });