import React from "react"

export default function Comment(props) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>用户评论</h3>
      <section
        ref={elem => {
          if (!elem || elem.childElementCount > 0) {
            return
          }
          const scriptElem = document.createElement("script")
          scriptElem.src = "https://utteranc.es/client.js"
          scriptElem.async = true
          scriptElem.crossOrigin = "anonymous"
          scriptElem.setAttribute("repo", "yiuyiu/blog")
          scriptElem.setAttribute("issue-term", "title")
          scriptElem.setAttribute("theme", "github-light")
          elem.appendChild(scriptElem)
        }}
      />
    </div>
  )
}
