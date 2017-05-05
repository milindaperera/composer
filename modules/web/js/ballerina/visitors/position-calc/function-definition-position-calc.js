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

import log from 'log';
import _ from 'lodash';
import ASTFactory from './../../ast/ballerina-ast-factory';
import * as DesignerDefaults from './../../configs/designer-defaults';
import { util } from './../sizing-utils';

class FunctionDefinitionPositionCalcVisitor {

    canVisit(node) {
        log.debug('can visit FunctionDefinitionPositionCalc');
        return true;
    }

    beginVisit(node) {
        let viewSate = node.getViewState();
        let bBox = viewSate.bBox;
        let parent = node.getParent();
        let panelChildren = parent.filterChildren(function (child) {
            return ASTFactory.isFunctionDefinition(child) ||
                ASTFactory.isServiceDefinition(child) || ASTFactory.isConnectorDefinition(child)
                || ASTFactory.isAnnotationDefinition(child);
        });
        let heading = viewSate.components.heading;
        let body = viewSate.components.body;
        let currentFunctionIndex = _.findIndex(panelChildren, node);
        let statementContainer = viewSate.components.statementContainer;
        let x, y, headerX, headerY, bodyX, bodyY;
        if (currentFunctionIndex === 0) {
            headerX = DesignerDefaults.panel.wrapper.gutter.h;
            headerY = DesignerDefaults.panel.wrapper.gutter.v;
        } else if (currentFunctionIndex > 0) {
            let previousPanelBBox = panelChildren[currentFunctionIndex - 1].getViewState().bBox;
            headerX = DesignerDefaults.panel.wrapper.gutter.h;
            headerY = previousPanelBBox.y + previousPanelBBox.h + DesignerDefaults.panel.wrapper.gutter.v;
        } else {
            throw 'Invalid Index for Function Definition';
        }

        x = headerX;
        y = headerY;
        bodyX = headerX;
        bodyY = headerY + heading.h;

        bBox.x = x;
        bBox.y = y;
        heading.x = headerX;
        heading.y = headerY;
        body.x = bodyX;
        body.y = bodyY;

        statementContainer.x = bodyX + DesignerDefaults.innerPanel.body.padding.left;
        statementContainer.y = bodyY + DesignerDefaults.innerPanel.body.padding.top +
            DesignerDefaults.lifeLine.head.height;

        //defaultWorker.x = statementContainer.x + (statementContainer.w - defaultWorker.w)/2;
        //defaultWorker.y = statementContainer.y - DesignerDefaults.lifeLine.head.height;

        // Setting positions of parameters.
        let lastParameterEndXPosition = node.getViewState().bBox.x + viewSate.titleWidth;
        node.getViewState().components['parametersPrefixContainer'].x = node.getViewState().bBox.x + viewSate.titleWidth;
        let nextXPositionOfParameter = node.getViewState().components['parametersPrefixContainer'].x +
            node.getViewState().components['parametersPrefixContainer'].w;
        if (node.getArguments().length > 0) {
            for (let i = 0; i < node.getArguments().length; i++) {
                let resourceParameter = node.getArguments()[i];
                let viewState = resourceParameter.getViewState();
                if (i !== 0) {
                    nextXPositionOfParameter = nextXPositionOfParameter + 14;
                }

                viewState.x = nextXPositionOfParameter;
                nextXPositionOfParameter += util.getTextWidth(resourceParameter.getParameterAsString()).w;

                if (i === node.getArguments().length - 1) {
                    lastParameterEndXPosition = viewState.x + util.getTextWidth(resourceParameter.getParameterAsString()).w;
                }
            }
        }

        // Setting positions of return types.
        node.getViewState().components['returnTypesPrefixContainer'].x = lastParameterEndXPosition + node.getViewState().bBox.x + viewSate.titleWidth;
        let nextXPositionOfReturnType = node.getViewState().components['returnTypesPrefixContainer'].x +
            node.getViewState().components['returnTypesPrefixContainer'].w;
        if (node.getReturnTypes().length > 0) {
            for (let i = 0; i < node.getReturnTypes().length; i++) {
                let returnType = node.getReturnTypes()[i];
                let viewState = returnType.getViewState();
                if (i !== 0) {
                    nextXPositionOfReturnType = nextXPositionOfReturnType + 14;
                }

                viewState.x = nextXPositionOfReturnType;
                nextXPositionOfReturnType += util.getTextWidth(returnType.getArgumentAsString()).w;
            }
        }

        log.debug('begin visit FunctionDefinitionPositionCalc');
    }

    visit(node) {
        log.debug('visit FunctionDefinitionPositionCalc');
    }

    endVisit(node) {
        log.debug('end visit FunctionDefinitionPositionCalc');
    }
}

export default FunctionDefinitionPositionCalcVisitor;