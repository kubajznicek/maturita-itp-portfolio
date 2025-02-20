import React, { Component } from "react"
import { t } from "../Functions"

class ProblemsModal extends Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    render() {
        return (
            <div className="modal fade" id="problemsModal" tabIndex="-1" aria-labelledby="problemsModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="problemsModal">{t("having_problems", this.props.lang)} ?</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                        <div className="modal-body" dangerouslySetInnerHTML={{ __html: t("problems_modal_text", this.props.lang)}}>
                        
                        </div>
                            <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">{t("cancel", this.props.lang)}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ProblemsModal
