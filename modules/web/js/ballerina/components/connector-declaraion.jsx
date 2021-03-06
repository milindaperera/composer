/**
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ConnectorDeclrationAST from './../ast/connector-declaration';
import LifeLine from './lifeline.jsx';
import { getComponentForNodeArray } from './utils';
import ConnectorActivationContainer from './connector-activation-container';
import * as DesignerDefaults from './../configs/designer-defaults';

/**
 * Get all components.
 *
 * @param {any} requireContext The context.
 * @returns {Object} components.
 */
function requireAll(requireContext) {
    const components = {};
    requireContext.keys().forEach((item) => {
        const module = requireContext(item);
        if (module.default) {
            components[module.default.name] = module.default;
        }
    });
    return components;
}
const components = requireAll(require.context('./', true, /\.jsx$/));

/**
 * React component for connector declration.
 *
 * @class ConnectorDeclaration
 * @extends {React.Component}
 */
class ConnectorDeclaration extends React.Component {

    /**
     * Creates an instance of ConnectorDeclaration.
     * @param {Object} props React properties.
     * @memberof ConnectorDeclaration
     */
    constructor(props) {
        super(props);
        this.components = components;

        this.editorOptions = {
            propertyType: 'text',
            key: 'ConnectorDeclaration',
            model: props.model,
            getterMethod: props.model.getStatementString,
            setterMethod: props.model.setStatementFromString,
        };

        this.onDelete = this.onDelete.bind(this);
    }

    /**
     * On delete event for lifeline.
     * @memberof ConnectorDeclaration
     */
    onDelete() {
        this.props.model.remove();
    }

    /**
     * Renders connector declration lifeline.
     *
     * @returns {ReactElement} The view.
     * @memberof ConnectorDeclaration
     */
    render() {
        const statementContainerBBox = this.props.model.viewState.components.statementContainer;
        const connectorBBox = {};
        const model = this.props.model;
        const connectorName = model.getViewState().variableTextTrimmed;
        const children = getComponentForNodeArray(this.props.model.getChildren());
        connectorBBox.x = statementContainerBBox.x + ((statementContainerBBox.w - DesignerDefaults.lifeLine.width) / 2);
        connectorBBox.y = statementContainerBBox.y - DesignerDefaults.lifeLine.head.height;
        connectorBBox.w = DesignerDefaults.lifeLine.width;
        connectorBBox.h = statementContainerBBox.h + (DesignerDefaults.lifeLine.head.height * 2);

        const classes = {
            lineClass: 'connector-life-line',
            polygonClass: 'connector-life-line-polygon',
        };

        return (<g>
            <ConnectorActivationContainer bBox={statementContainerBBox} activationTarget={model} />
            <LifeLine
                title={connectorName}
                bBox={connectorBBox}
                editorOptions={this.editorOptions}
                onDelete={this.onDelete}
                classes={classes}
            />
            {children}
        </g>
        );
    }
}

ConnectorDeclaration.propTypes = {
    model: PropTypes.instanceOf(ConnectorDeclrationAST).isRequired,
};

export default ConnectorDeclaration;
