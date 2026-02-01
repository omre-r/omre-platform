import React, { useState } from 'react';
import { Button, Card, Heading, Text, View } from '@aws-amplify/ui-react';

export default function ProductsPanel() {
    return (
        <View padding="medium">
            <Card>
                <Heading level={2}>Products Panel</Heading>
                <Text>This is the product panel section of the admin dashboard.</Text>
            </Card>
        </View>
    );
}