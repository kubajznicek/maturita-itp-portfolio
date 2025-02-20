import translations from "./Translations"

export function logEnvironment() {
  if (process.env.NODE_ENV === "development") {
    console.log(`environment: ${process.env.NODE_ENV} `)
  }
}

export function autoGrow(e) {
  const element = e.target
  element.style.height = "5px"
  element.style.height = element.scrollHeight + "px"
}

/**
  *  Function to validate email address, returns true if valid
  *  @param eventTarget - event.target
  * 
  *  @return bool
  *   
  * @example
  *  <input type="email" onChange={(e) => emailValidation(e)} />
  *   
  * @description
  * validate email address using regex
  * 
  *
  */
export function emailValidation(eventTarget) {
  if (eventTarget.value === undefined) {
    return false
  }
  if (eventTarget.value === "") {
    eventTarget.classList.remove("is-invalid")
    return true
  }
  if (!/^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/.test(eventTarget.value)) {
    eventTarget.classList.add("is-invalid")
    eventTarget.focus()
    return false
  } else {
    eventTarget.classList.remove("is-invalid")
    return true
  }
}

export async function mapyczApi(address) {
  return new Promise((resolve, reject) => {
    const query = address
    const mapyApiKey = process.env.REACT_APP_MAPYCZ_API
    const url = `https://api.mapy.cz/v1/suggest?query=${query}&lang=cs&limit=5&country=cz&type=regional.address`
    fetch(url, {
      headers: { accept: "application/json", "X-Mapy-Api-Key": mapyApiKey },
    })
      .then((response) => response.json())
      .then((data) => {
        data.items.forEach((item) => {
          if (item.zip === undefined) {
            item.zip = ""
          }
        })
        resolve(data.items)
      })
      .catch((error) => {
        console.error("Error fetching data:", error)
        reject(error)
      })
  })
}

export function closeModal(id) {
  const ModalElement = document.getElementById(id)
  const Modal = bootstrap.Modal.getInstance(ModalElement)
  Modal.hide()
}


export function showPassword (input_id, icon_id) {
  const icon = document.getElementById(icon_id)
  const input = document.getElementById(input_id)
  if (input.type === "password") {
    input.type = "text"
    icon.classList = "fa fa-eye"
  } else {
    input.type = "password"
    icon.classList = "fa fa-eye-slash"
  }
}

export function t( text, language) {
  if (text === undefined || text === "") {
    return ""
  }
  const translation = translations[language]?.[text];

  if (!translation) {
    console.warn(`Translation for '${text}' is missing in '${language}'`);
    return text;
  }
  return translation;
}