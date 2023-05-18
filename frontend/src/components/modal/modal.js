import './modal.css'
import { useEffect } from 'react';

const Modal = ({ isVisible, title, content, footer, onClose }) => {
    const keydownHandler = ({ key }) => {
      switch (key) {
        case 'Escape':
          onClose();
          break;
        default:
      }
    };
  
    useEffect(() => {
      document.addEventListener('keydown', keydownHandler);
      return () => document.removeEventListener('keydown', keydownHandler);
    });
  
    return !isVisible ? null : (
      <div className="modal1" onClick={onClose}>
        <div className="modal1-dialog" onClick={e => e.stopPropagation()}>
          <div className="modal1-header">
            <h3 className="modal1-title">{title}</h3>
          </div>
          <div className="modal1-body">
            <div className="modal1-content">{content}</div>
          </div>
          {footer && <div className="modal1-footer">{footer}</div>}
        </div>
      </div>
    );
  };

  export default Modal;