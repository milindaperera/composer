/**
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import { statement } from './../configs/designer-defaults';
import { blockStatement } from './../configs/designer-defaults';
import BallerinaASTFactory from './../ast/ballerina-ast-factory'
import SimpleBBox from './../ast/simple-bounding-box';
import * as DesignerDefaults from './../configs/designer-defaults';
import ASTFactory from './../ast/ballerina-ast-factory';
import _ from 'lodash';

class SizingUtil {
    constructor() {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('style', 'border: 1px solid black');
        svg.setAttribute('width', '600');
        svg.setAttribute('height', '250');
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        this.textElement = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        svg.appendChild(this.textElement);
        document.body.appendChild(svg);
    }

    getTextWidth(text, statementMinWidth = statement.width) {
        this.textElement.innerHTML = _.escape(text);
        let width = statement.padding.left + this.textElement.getComputedTextLength() + statement.padding.right;
        // if the width is more then max width crop the text
        if (width <= statementMinWidth) {
            //set the width to minimam width
            width = statementMinWidth;
        } else if (width > statementMinWidth && width <= statement.maxWidth) {
            // do nothing
        } else {
            // We need to truncate displayText and show an ellipses at the end.
            var ellipses = '...';
            var possibleCharactersCount = 0;
            for (var i = (text.length - 1); 1 < i; i--) {
                if ((statement.padding.left + this.textElement.getSubStringLength(0, i) + statement.padding.right) < statement.maxWidth) {
                    possibleCharactersCount = i;
                    break;
                }
            }
            // We need room for the ellipses as well, hence removing 'ellipses.length' no. of characters.
            text = text.substring(0, (possibleCharactersCount - ellipses.length)) + ellipses; // Appending ellipses.

            width = statement.maxWidth;
        }
        return {
            w: width,
            text: text
        };
    }

    populateSimpleStatementBBox(expression, viewState) {
        var textViewState = util.getTextWidth(expression);
        let dropZoneHeight = statement.gutter.v;
        viewState.components['drop-zone'] = new SimpleBBox();
        viewState.components['drop-zone'].h = dropZoneHeight;

        viewState.bBox.w = textViewState.w;
        viewState.bBox.h = statement.height + viewState.components['drop-zone'].h;

        viewState.expression = textViewState.text;
        return viewState;
    }

    getHighestStatementContainer(workers) {
        const sortedWorkers = _.sortBy(workers, function (worker) {
            return worker.viewState.components.statementContainer.h;
        });
        return sortedWorkers.length > 0 ? sortedWorkers[sortedWorkers.length - 1].getViewState().components.statementContainer.h : -1;
    }

    populateCompoundStatementChild(node) {
        let viewState = node.getViewState();
        let components = {};

        components['statementContainer'] = new SimpleBBox();
        var statementChildren = node.filterChildren(BallerinaASTFactory.isStatement);
        var statementContainerWidth = 0;
        var statementContainerHeight = 0;

        _.forEach(statementChildren, function (child) {
            statementContainerHeight += child.viewState.bBox.h;
            if (child.viewState.bBox.w > statementContainerWidth) {
                statementContainerWidth = child.viewState.bBox.w;
            }
        });

        /**
         * Add the left padding and right padding for the statement container and
         * add the additional gutter height to the statement container height, in order to keep the gap between the
         * last statement and the block statement bottom margin
         */
        statementContainerHeight += (statementContainerHeight > 0 ? statement.gutter.v :
            blockStatement.body.height - blockStatement.heading.height);

        statementContainerWidth += (statementContainerWidth > 0 ?
            (blockStatement.body.padding.left + blockStatement.body.padding.right) : blockStatement.width);

        components['statementContainer'].h = statementContainerHeight;
        components['statementContainer'].w = statementContainerWidth;

        viewState.bBox.h = statementContainerHeight + blockStatement.heading.height;
        viewState.bBox.w = statementContainerWidth;

        viewState.components = components;
    }

    populatePanelDecoratorBBox(node, name) {
        var viewState = node.getViewState();
        var components = {};

        components['heading'] = new SimpleBBox();
        components['heading'].h = DesignerDefaults.panel.heading.height;

        components['statementContainer'] = new SimpleBBox();
        var statementChildren = node.filterChildren(BallerinaASTFactory.isStatement);
        var statementWidth = DesignerDefaults.statementContainer.width;
        var statementHeight = 0;

        _.forEach(statementChildren, function (child) {
            statementHeight += child.viewState.bBox.h + DesignerDefaults.statement.gutter.v;
            if (child.viewState.bBox.w > statementWidth) {
                statementWidth = child.viewState.bBox.w;
            }
        });

        /**
         * We add an extra gap to the statement container height, in order to maintain the gap between the
         * last statement's bottom margin and the default worker bottom rect's top margin
         */
        statementHeight += DesignerDefaults.statement.gutter.v;

        components['statementContainer'].h = statementHeight;
        components['statementContainer'].w = statementWidth;

        components['body'] = new SimpleBBox();

        let workerChildren = node.filterChildren(function (child) {
            return BallerinaASTFactory.isWorkerDeclaration(child);
        });

        let connectorChildren = node.filterChildren(function (child) {
            return BallerinaASTFactory.isConnectorDeclaration(child);
        });

        const highestStatementContainerHeight = util.getHighestStatementContainer(workerChildren);
        const workerLifeLineHeight = components['statementContainer'].h + DesignerDefaults.lifeLine.head.height * 2;

        var lifeLineWidth = 0;
        _.forEach(workerChildren.concat(connectorChildren), function (child) {
            lifeLineWidth += child.viewState.bBox.w + DesignerDefaults.lifeLine.gutter.h;
            child.getViewState().bBox.h = _.max([components['statementContainer'].h, highestStatementContainerHeight]) +
                DesignerDefaults.lifeLine.head.height * 2;
            child.getViewState().components.statementContainer.h = _.max([components['statementContainer'].h,
                highestStatementContainerHeight]);
        });

        if (node.viewState.collapsed) {
            components['body'].h = 0;
        } else {
            components['body'].h = ((DesignerDefaults.panel.body.height < workerLifeLineHeight) ? workerLifeLineHeight : DesignerDefaults.panel.body.height)
                + DesignerDefaults.panel.body.padding.top + DesignerDefaults.panel.body.padding.bottom;
        }

        /**
         * If the current default worker's statement container height is less than the highest worker's statement container
         * we set the default statement container height to the highest statement container's height
         */
        components['statementContainer'].h = _.max([components['statementContainer'].h, highestStatementContainerHeight]);

        components['body'].w = components['statementContainer'].w + DesignerDefaults.panel.body.padding.right +
            DesignerDefaults.panel.body.padding.left + lifeLineWidth;
        components['heading'].w = components['body'].w;

        viewState.bBox.h = components['heading'].h + components['body'].h;
        viewState.bBox.w = components['body'].w;

        viewState.titleWidth = util.getTextWidth(name).w;

        components['parametersPrefixContainer'] = {};
        components['parametersPrefixContainer'].w = util.getTextWidth('Parameters: ').w;

        viewState.components = components;
    }

    populateOuterPanelDecoratorBBox(node) {
        let viewState = node.getViewState();
        let components = {};
        let totalResourceHeight = 0;
        let connectorStatementContainerHeight = 0;
        let resources = node.filterChildren(function (child) {
            return ASTFactory.isResourceDefinition(child) ||
                ASTFactory.isConnectorAction(child);
        });
        let connectors = node.filterChildren(function (child) {
            return ASTFactory.isConnectorDeclaration(child)
        });
        let maxResourceWidth = 0;
        //Initial statement height include panel heading and panel padding.
        let bodyHeight = DesignerDefaults.panel.body.padding.top + DesignerDefaults.panel.body.padding.bottom;
        // Set the width initial value to the padding left and right
        var bodyWidth = DesignerDefaults.panel.body.padding.left + DesignerDefaults.panel.body.padding.right;

        /**
         * If there are service level connectors, their height depends on the heights of the resources
         */
        _.forEach(resources, function (resource) {
            totalResourceHeight += resource.getViewState().bBox.h;
            if (maxResourceWidth < resource.getViewState().bBox.w) {
                maxResourceWidth = resource.getViewState().bBox.w;
            }
        });

        /**
         * Set the max resource width to the resources
         */
        _.forEach(resources, function (resource) {
            resource.getViewState().bBox.w = maxResourceWidth;
            resource.getViewState().components.body.w = maxResourceWidth;
            resource.getViewState().components.heading.w = maxResourceWidth;
        });

        // Add the max resource width to the body width
        bodyWidth += maxResourceWidth;

        /**
         * Set the connector statement container height and the connectors' height accordingly only if there are service
         * level connectors
         */
        if (connectors.length > 0) {
            if (totalResourceHeight <= 0) {
                // There are no resources in the service
                connectorStatementContainerHeight = DesignerDefaults.statementContainer.height;
            } else {
                // Here we add additional gutter height to balance the gaps from top and bottom
                connectorStatementContainerHeight = totalResourceHeight +
                    DesignerDefaults.panel.wrapper.gutter.v * (resources.length + 1);
            }
            /**
             * Adjust the height of the connectors and adjust the service's body width with the connector widths
             */
            _.forEach(connectors, function (connector) {
                connector.getViewState().bBox.h = connectorStatementContainerHeight +
                    DesignerDefaults.lifeLine.head.height * 2;
                connector.getViewState().components.statementContainer.h = connectorStatementContainerHeight;
                bodyWidth += (connector.getViewState().components.statementContainer.w + DesignerDefaults.lifeLine.gutter.h);
            });

            bodyHeight = connectorStatementContainerHeight + DesignerDefaults.lifeLine.head.height * 2 +
                DesignerDefaults.panel.body.padding.top + DesignerDefaults.panel.body.padding.bottom;
        } else if (totalResourceHeight > 0) {
            bodyHeight = totalResourceHeight + DesignerDefaults.panel.body.padding.top +
                DesignerDefaults.panel.body.padding.bottom + DesignerDefaults.panel.wrapper.gutter.v * (resources.length - 1);
        } else {
            // There are no connectors as well as resources, since we set the default height
            bodyHeight = DesignerDefaults.innerPanel.body.height;
        }

        components['heading'] = new SimpleBBox();
        components['body'] = new SimpleBBox();
        components['heading'].h = DesignerDefaults.panel.heading.height;
        if (node.viewState.collapsed) {
            components['body'].h = 0;
        } else {
            components['body'].h = bodyHeight;
        }
        components['body'].w = bodyWidth;
        components['heading'].w = bodyWidth;

        viewState.bBox.h = components['heading'].h + components['body'].h;
        viewState.bBox.w = components['body'].w;

        viewState.components = components;
    }

    getStatementHeightBefore(statement) {
        var parent = statement.getParent();
        var statements = parent.filterChildren(BallerinaASTFactory.isStatement);
        var currentStatementIndex = _.indexOf(statements, statement);
        var statementsBefore = _.slice(statements, 0, currentStatementIndex);

        var height = 0;
        _.forEach(statementsBefore, function (stmt) {
            height += stmt.getViewState().bBox.h;
        });

        return height;
    }

    getDefaultStatementHeight() {
        return statement.height + statement.gutter.v;
    }
}


export let util = new SizingUtil();