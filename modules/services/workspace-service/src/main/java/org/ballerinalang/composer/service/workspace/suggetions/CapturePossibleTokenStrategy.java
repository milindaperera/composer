/*
*  Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
*  WSO2 Inc. licenses this file to you under the Apache License,
*  Version 2.0 (the "License"); you may not use this file except
*  in compliance with the License.
*  You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing,
*  software distributed under the License is distributed on an
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
*  KIND, either express or implied.  See the License for the
*  specific language governing permissions and limitations
*  under the License.
*/
package org.ballerinalang.composer.service.workspace.suggetions;

import org.antlr.v4.runtime.DefaultErrorStrategy;
import org.antlr.v4.runtime.InputMismatchException;
import org.antlr.v4.runtime.NoViableAltException;
import org.antlr.v4.runtime.Parser;
import org.antlr.v4.runtime.ParserRuleContext;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.misc.IntervalSet;
import org.ballerinalang.composer.service.workspace.rest.datamodel.SourcePosition;

import java.util.LinkedList;
import java.util.List;

/**
 * Capture possible errors from source
 */
public class CapturePossibleTokenStrategy extends DefaultErrorStrategy {

    protected final SourcePosition cursorPosition;

    protected List<PossibleToken> possibleTokens;

    public CapturePossibleTokenStrategy(SourcePosition cursorPosition) {
            this.cursorPosition = cursorPosition;
            possibleTokens = new LinkedList<>();
    }
    @Override
    public void reportInputMismatch(Parser parser, InputMismatchException e) {
        fetchPossibleTokens(parser, e.getOffendingToken(), e.getExpectedTokens());
    }

    @Override
    public void reportMissingToken(Parser parser) {
        fetchPossibleTokens(parser, parser.getCurrentToken(), parser.getExpectedTokens());
    }

    @Override
    public void reportNoViableAlternative(Parser parser, NoViableAltException e) {
        fetchPossibleTokens(parser, e.getOffendingToken(), e.getExpectedTokens());
    }

    @Override
    public void reportUnwantedToken(Parser parser) {
        fetchPossibleTokens(parser, parser.getCurrentToken(), parser.getExpectedTokens());
    }

    public List<PossibleToken> getPossibleTokens() {
        return possibleTokens;
    }

    protected void fetchPossibleTokens(Parser parser, Token currentToken, IntervalSet expectedTokens) {
        ParserRuleContext currentContext = parser.getContext();
        if (isCursorBetweenGivenTokenAndLastNonHiddenToken(currentToken, parser)) {
            expectedTokens.getIntervals().forEach((interval) -> {
                int a = interval.a;
                int b = interval.b;
                if (a == b) {
                    possibleTokens.add(new PossibleToken(a, parser.getVocabulary().getDisplayName(a),
                            currentContext));
                } else {
                    for (int i = a; i <= b; ++i) {
                        possibleTokens.add(new PossibleToken(i, parser.getVocabulary().getDisplayName(i),
                                currentContext));
                    }
                }
            });
        }

    }

    /**
     * Checks whether cursor is within the whitespace region between current token to last token
     * @param parser
     */
    protected boolean isCursorBetweenGivenTokenAndLastNonHiddenToken(Token token, Parser parser) {
            boolean isCursorBetween = false;
            if (cursorPosition.equals(getSourcePosition(token))) {
                isCursorBetween = true;
            } else {
                Token lastNonHiddenToken = null;
                for (int tokenIdx = token.getTokenIndex() - 1; tokenIdx >= 0; tokenIdx--) {
                    Token lastToken = parser.getTokenStream().get(tokenIdx);
                    if (lastToken.getChannel() != Token.HIDDEN_CHANNEL) {
                        lastNonHiddenToken = lastToken;
                        break;
                    }
                }
                if (lastNonHiddenToken != null) {
                    if (cursorPosition.getLineNumber() >= lastNonHiddenToken.getLine()
                            && cursorPosition.getLineNumber() <= token.getLine()) {
                        if (cursorPosition.getLineNumber() == lastNonHiddenToken.getLine()) {
                            isCursorBetween = cursorPosition.getOffset() >=
                                    (lastNonHiddenToken.getCharPositionInLine()
                                            + lastNonHiddenToken.getText().length());
                        } else if (cursorPosition.getLineNumber() == token.getLine()) {
                            isCursorBetween = cursorPosition.getOffset() <= token.getCharPositionInLine();
                        } else {
                            isCursorBetween = true;
                        }
                    }
                }

            }
            return isCursorBetween;
    }

    protected SourcePosition getSourcePosition(Token token) {
        return new SourcePosition(token.getLine(), token.getCharPositionInLine());
    }
}
