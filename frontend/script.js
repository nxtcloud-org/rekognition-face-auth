document.addEventListener("DOMContentLoaded", () => {
  const LAMBDA_FUNCTION_URL = "여기에 람다 함수 URL을 입력하세요";
  console.log("LAMBDA_FUNTION_URL: ", LAMBDA_FUNCTION_URL);
  const usernameInput = document.getElementById("username");
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  const preview = document.getElementById("preview");
  const captureBtn = document.getElementById("captureBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const retakeBtn = document.getElementById("retakeBtn");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const fileInput = document.getElementById("fileInput");
  const errorMessage = document.getElementById("errorMessage");
  const statusMessage = document.getElementById("statusMessage");
  const initialButtons = document.getElementById("initialButtons");
  const afterCaptureButtons = document.getElementById("afterCaptureButtons");
  const expandBtn = document.getElementById("expandBtn");
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const closeModal = document.getElementsByClassName("close")[0];
  let stream;
  let capturedImage = null;

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      video.srcObject = stream;
      errorMessage.style.display = "none";
    } catch (err) {
      console.error("카메라 접근 오류:", err);
      errorMessage.style.display = "block";
      captureBtn.disabled = true;
    }
  }

  function showAfterCaptureButtons() {
    initialButtons.style.display = "none";
    afterCaptureButtons.style.display = "block";
    expandBtn.style.display = "block";
  }

  function showInitialButtons() {
    initialButtons.style.display = "block";
    afterCaptureButtons.style.display = "none";
    expandBtn.style.display = "none";
  }

  captureBtn.onclick = () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    video.style.display = "none";
    canvas.style.display = "block";
    capturedImage = canvas.toDataURL("image/jpeg");
    showAfterCaptureButtons();
  };

  retakeBtn.onclick = () => {
    video.style.display = "block";
    canvas.style.display = "none";
    preview.style.display = "none";
    capturedImage = null;
    statusMessage.style.display = "none";
    showInitialButtons();
  };

  uploadBtn.onclick = () => {
    fileInput.click();
  };

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let newWidth, newHeight;
          if (aspectRatio > 1) {
            newWidth = canvas.width;
            newHeight = canvas.width / aspectRatio;
          } else {
            newHeight = canvas.height;
            newWidth = canvas.height * aspectRatio;
          }
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          canvas.style.display = "block";
          preview.style.display = "none";
          video.style.display = "none";
          capturedImage = canvas.toDataURL("image/jpeg");
          showAfterCaptureButtons();
        };
        img.src = e.target.result;
        modalImg.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  async function sendRequest(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const msg = await response.json();
      return {
        result: response.ok,
        status: response.status,
        msg: msg,
      };
    } catch (error) {
      console.error(error);
    }
  }

  function prepareImageData(imageDataUrl) {
    return imageDataUrl.split(",")[1]; // 'data:image/jpeg;base64,' 부분 제거
  }

  function showMessage(message, isSuccess) {
    statusMessage.textContent = message;
    statusMessage.className =
      "status-message " + (isSuccess ? "success" : "error");
    statusMessage.style.display = "block";
  }

  if (signupBtn) {
    signupBtn.onclick = async (e) => {
      e.preventDefault();
      if (!capturedImage || !usernameInput.value) {
        showMessage(
          "사용자 이름을 입력하고 사진을 촬영하거나 업로드해주세요.",
          false
        );
        return;
      }

      try {
        const data = {
          username: usernameInput.value,
          image: prepareImageData(capturedImage),
        };
        const res = await sendRequest(
          `${LAMBDA_FUNCTION_URL}?authType=signup`,
          data
        );
        showMessage(
          "회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.",
          true
        );
        console.log(res.msg);
        setTimeout(() => {
          window.location.href = "/"; // 로그인 페이지로 리다이렉트
        }, 2000);
      } catch (error) {
        showMessage(error.message || "회원가입 중 오류가 발생했습니다.", false);
      }
    };
  }

  if (loginBtn) {
    loginBtn.onclick = async (e) => {
      e.preventDefault();
      if (!capturedImage || !usernameInput.value) {
        showMessage(
          "사용자 이름을 입력하고 사진을 촬영하거나 업로드해주세요.",
          false
        );
        return;
      }
      try {
        const data = {
          username: usernameInput.value,
          image: prepareImageData(capturedImage),
        };
        const res = await sendRequest(
          `${LAMBDA_FUNCTION_URL}?authType=login`,
          data
        );
        if (res.result) showMessage("로그인 성공!", true);
        else showMessage("로그인 실패. 다시 시도해주세요.", false);
        console.log(res.msg);
      } catch (error) {
        console.error(error);
      }
    };
  }

  expandBtn.onclick = () => {
    modal.style.display = "block";
  };

  closeModal.onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  startCamera();
});
