import React from "react"
import { Link } from "gatsby"

import { ThemeToggler } from 'gatsby-plugin-dark-mode'

import sun from "./images/sun.png"
import moon from "./images/moon.png"


import { rhythm, scale } from "../utils/typography"

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  let header

  if (location.pathname === rootPath) {
    header = (
      <div>
        <h1
          style={{
            ...scale(1.5),
            marginBottom: rhythm(1.5),
            marginTop: 0,
          }}
          className="header-link"
        >
          <Link
            style={{
              boxShadow: `none`,
              color: `inherit`,
              borderBottom: `none`, // to remove border from anchor
            }}
            className="header-link"
            to={`/`}
          >
            {title}
          </Link>
        </h1>
      </div>
    )
  } else {
    header = (
      <h3
        style={{
          fontFamily: `Montserrat, sans-serif`,
          marginTop: 0,
        }}
        className="header-link-2"
      >
        <Link
          style={{
            boxShadow: `none`,
            color: `inherit`,
          }}
          className="header-link-2"
          to={`/`}
        >
          {title}
        </Link>
      </h3>
    )
  }
  let theme_toggle = (<ThemeToggler>
    {({ theme, toggleTheme }) => (
      <label
        onClick={_ => toggleTheme(theme === 'light' ? 'dark' : 'light')}
        style={{
          fontFamily: `monospace`,
          position: `absolute`,
          top: `10px`,
          right: `10px`
        }}
      >
        {theme === 'dark' ? (
          <img width="40px"src={sun} alt="Light mode" />
            //<p>0xfff</p>
        ) : (
          <img width="40px" src={moon} alt="Light mode" />
          //<p>0x000</p>
        )}

      </label>
    )}
  </ThemeToggler>)
  return (
    <div
      style={{
        marginLeft: `auto`,
        marginRight: `auto`,
        maxWidth: rhythm(24),
        padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
      }}
    >
      <header>{header} {theme_toggle}</header>
      <main>{children}</main>
    </div>
  )
}

export default Layout
