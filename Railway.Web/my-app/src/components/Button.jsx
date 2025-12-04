const Button = ({ children, className = "" }) => (
  <button className={`px-4 py-2 rounded font-medium ${className}`}>
    {children}
  </button>
);

export default Button;
