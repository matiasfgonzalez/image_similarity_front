const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const clearButton = document.getElementById("clearButton");
const uploadImageInput = document.getElementById("uploadImage");
const uploadButton = document.getElementById("uploadButton");
const compareButton = document.getElementById("compareButton");
const resultsDiv = document.getElementById("results");

// Ajuste de tamaño del canvas
canvas.width = 492;
canvas.height = 454;

// Variables para el dibujo
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Función para comenzar a dibujar
function startDrawing(event) {
  isDrawing = true;
  [lastX, lastY] = [event.offsetX, event.offsetY];
}

// Función para dibujar
function draw(event) {
  if (!isDrawing) return;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(event.offsetX, event.offsetY);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.stroke();
  [lastX, lastY] = [event.offsetX, event.offsetY];
}

// Función para detener el dibujo
function stopDrawing() {
  isDrawing = false;
}

// Función para limpiar el canvas
clearButton.addEventListener("click", () => {
  uploadImageInput.value = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resultsDiv.innerHTML = ""; // Limpiar los resultados al limpiar el canvas
});

// Función para cargar una imagen en el canvas
uploadButton.addEventListener("click", () => {
  const file = uploadImageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Función para consultar la API y obtener las imágenes más similares
compareButton.addEventListener("click", async () => {
  const responseDiv = document.getElementById("results");

  // Convert canvas to Blob
  canvas.toBlob(async (blob) => {
    if (!blob) return;

    const formData = new FormData();
    formData.append("file", blob, "drawing.png");

    try {
      const response = await fetch("http://localhost:8000/compare-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      displayResponse(result);
    } catch (error) {
      responseDiv.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
  });
});

// Display API response
function displayResponse(result) {
  const responseDiv = document.getElementById("results");
  if (result.similar_images && result.similar_images.length > 0) {
    responseDiv.innerHTML = "<h3>Similar Images Found:</h3>";
    result.similar_images.forEach((img) => {
      const imgInfo = document.createElement("p");
      imgInfo.textContent = `Image: ${img.filename}, Similarity: ${(
        img.average_similarity * 100
      ).toFixed(2)}%`;
      responseDiv.appendChild(imgInfo);
    });
  } else {
    responseDiv.innerHTML = "<p>No similar images found.</p>";
  }
}

// Función para mostrar los resultados obtenidos de la API
function displayResults(similarImages) {
  resultsDiv.innerHTML = ""; // Limpiar resultados anteriores

  if (similarImages.length === 0) {
    resultsDiv.innerHTML = "<p>No se encontraron imágenes similares.</p>";
    return;
  }

  const resultsList = document.createElement("ul");
  similarImages.forEach((image) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
            <p><strong>Imagen:</strong> ${image.filename}</p>
            <p><strong>Similitud Grayscale:</strong> ${image.gray_similarity.toFixed(
              2
            )}</p>
            <p><strong>Similitud HSV:</strong> ${image.hsv_similarity.toFixed(
              2
            )}</p>
            <p><strong>Similitud ORB:</strong> ${image.orb_similarity.toFixed(
              2
            )}</p>
            <p><strong>Similitud Promedio:</strong> ${image.average_similarity.toFixed(
              2
            )}</p>
            <hr>
        `;
    resultsList.appendChild(listItem);
  });

  resultsDiv.appendChild(resultsList);
}

// Event listeners para el dibujo
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);
