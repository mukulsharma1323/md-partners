import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Label, Notice } from './PharmacyUI';
export default function CatalogStatus({ catalog }) {
  return (
    <>
      {catalog.loading && (
        <ActivityIndicator accessibilityLabel="Loading medicines" />
      )}
      {!!catalog.error && (
        <>
          <Notice warning text={catalog.error} />
          <Button
            title="Retry"
            secondary
            onPress={catalog.retry}
            disabled={catalog.loading}
          />
        </>
      )}
      {!catalog.loading && !catalog.error && !catalog.items.length && (
        <Notice text="No medicines found." />
      )}
      <Label muted size={12}>
        {catalog.items.length} of {catalog.meta?.total ?? 0} medicines
      </Label>
      {!!catalog.meta?.hasNextPage && !catalog.error && (
        <Button
          title="Load more medicines"
          secondary
          onPress={catalog.loadMore}
          disabled={catalog.loading}
        />
      )}
    </>
  );
}
