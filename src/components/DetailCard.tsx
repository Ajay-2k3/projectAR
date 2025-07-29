interface DetailCardProps {
  marker: POIMarker;
  onClose: () => void;
}
export const DetailCard: React.FC<DetailCardProps> = ({ marker, onClose }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 rounded-t-xl shadow-2xl p-6 max-w-lg mx-auto">
    <div className="flex justify-between items-center mb-3">
      <h2 className="font-bold text-lg">{marker.name}</h2>
      <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">×</button>
    </div>
    {marker.imageUrl && <img src={marker.imageUrl} alt={marker.name} className="rounded-lg mb-2 max-h-36 object-cover w-full" />}
    {marker.type && <span className="inline-block px-3 py-1 mb-2 rounded-full bg-blue-100 text-blue-800 text-xs">{marker.type}</span>}
    <p className="text-gray-600 text-sm">{marker.address}</p>
    <p className="mt-2">{marker.description}</p>
    {/* Add more fields: rating, hours etc if desired */}
  </div>
);
